const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

const server = require('./qr');
const code = require('./pair');

require('events').EventEmitter.defaultMaxListeners = 500;

app.use('/server', server);
app.use('/code', code);

app.get('/pair', (req, res) => res.sendFile(path.join(process.cwd(), 'pair.html')));
app.get('/qr', (req, res) => res.sendFile(path.join(process.cwd(), 'qr.html')));
app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), 'main.html')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
