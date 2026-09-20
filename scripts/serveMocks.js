import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url || '/';
  if (reqPath === '/' || reqPath === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <head><title>IntentNav-SCFR Mock Sites</title></head>
      <body style="font-family:sans-serif; padding:30px;">
        <h2>IntentNav-SCFR Mock Benchmark Sites</h2>
        <ul>
          <li><a href="/mock-sites/site-a/index.html">Site A: Standard Original Portal</a></li>
          <li><a href="/mock-sites/site-b/index.html">Site B: Drifted Labels & Hierarchy</a></li>
          <li><a href="/mock-sites/site-c/index.html">Site C: Volatile IDs & Modals</a></li>
          <li><a href="/mock-sites/site-d/index.html">Site D: Adversarial Semantic Decoys</a></li>
        </ul>
      </body>
      </html>
    `);
    return;
  }

  const filePath = path.join(ROOT, reqPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`IntentNav Mock Sites Server running at http://localhost:${PORT}/`);
});

