const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

let router = express.Router();

// File remove helper
function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    if (!num) return res.status(400).send({ code: "❗ Missing number parameter" });
    num = num.replace(/[^0-9]/g, '');
    
    const sessionDir = path.join(__dirname, 'temp', id);

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        try {
            const sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS("Safari")
            });

            // Send pairing code if device not registered
            if (!sock.authState.creds.registered) {
                await delay(1500);
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) res.send({ code });
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === "open") {
                    // Wait until creds.json exists
                    const rf = path.join(sessionDir, 'creds.json');
                    let retries = 0;
                    while (!fs.existsSync(rf) && retries < 10) {
                        await delay(1000);
                        retries++;
                    }
                    if (!fs.existsSync(rf)) {
                        console.error("❌ creds.json not ready");
                        await sock.sendMessage(sock.user.id, { text: "❌ Session file not ready" });
                        return;
                    }

                    try {
                        // Upload to Mega
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const md = "PRINCE-MD=" + string_session;

                        await sock.sendMessage(sock.user.id, { text: "*✅ Your session ID is ready:*" });
                        await sock.sendMessage(sock.user.id, { text: md });

                        const desc = `*⚠️ Do not share this session ID with anyone.*\n\n*🔗 Github:* https://github.com/prince-pair/PAIR-WEB-PRINCE-MD`;
                        await sock.sendMessage(sock.user.id, { text: desc });

                    } catch (e) {
                        console.error("Upload/send error:", e);
                        await sock.sendMessage(sock.user.id, { text: "❌ Error creating session: " + e });
                    }

                    // Cleanup
                    await delay(2000);
                    sock.ws.close();
                    removeFile(sessionDir);
                    console.log(`👤 ${sock.user.id} connected & session sent!`);
                    process.exit();
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    console.log("🔄 Reconnecting...");
                    await delay(5000);
                    GIFTED_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Pairing error:", err);
            removeFile(sessionDir);
            if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
        }
    }

    await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
