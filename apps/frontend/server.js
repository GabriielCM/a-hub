const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const certsDir = path.join(__dirname, '..', '..', 'certs');
const httpsOptions = {
  key: fs.readFileSync(path.join(certsDir, 'localhost+3-key.pem')),
  cert: fs.readFileSync(path.join(certsDir, 'localhost+3.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
    console.log(`> Mobile access: https://192.168.1.7:${port}`);
  });
});
