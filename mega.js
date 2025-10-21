const Mega = require('mega'); // npm install mega
const fs = require('fs');

// === CONFIG ===
const email = 'alixbot9900@gmail.com';
const password = 'alixmdbot@00';

// === LOGIN ===
const storage = Mega({ email, password }, (err) => {
    if (err) {
        console.error('Login failed:', err);
        return;
    }
    console.log('Logged in to Mega.nz successfully!');
});

// === UPLOAD FUNCTION ===
/**
 * Upload a file to Mega.nz
 * @param {string} filePath - Local path of the file
 * @param {string} filename - Name to save as on Mega
 * @returns {Promise<string>} - Download link
 */
function upload(filePath, filename) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);

        storage.upload({ name: filename, stream: fileStream }, (err, file) => {
            if (err) return reject(err);

            const downloadLink = file.link();
            console.log('File uploaded successfully!');
            console.log('Download link:', downloadLink);
            resolve(downloadLink);
        });
    });
}

// === USAGE EXAMPLE ===
(async () => {
    try {
        const link = await upload('./testfile.txt', 'uploaded_testfile.txt');
        console.log('Mega.nz link:', link);
    } catch (err) {
        console.error('Upload error:', err);
    }
})();
