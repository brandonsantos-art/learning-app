#!/usr/bin/env node
/* NetSec Academy – tiny zero-dependency static server.
 * Usage: node serve.js [port]   then open http://localhost:<port>
 * Enables the installable offline PWA. For plain offline use you can also just
 * open index.html directly in a browser without this server. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2]) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};
const norm = s => s.replace(/\\/g, '/').toLowerCase();

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const fp = path.resolve(path.join(root, p));
  if (!norm(fp).startsWith(norm(root)) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found: ' + p); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(fp).pipe(res);
});

server.listen(port, () => {
  console.log('\n  NetSec Academy is running.\n');
  console.log('  On this computer:   http://localhost:' + port);
  try {
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) for (const ni of nets[name]) {
      if (ni.family === 'IPv4' && !ni.internal) console.log('  On this network:    http://' + ni.address + ':' + port + '   (open this on your phone/tablet)');
    }
  } catch (e) {}
  console.log('\n  Press Ctrl+C to stop.\n');
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') { console.error('Port ' + port + ' is in use. Try:  node serve.js ' + (port + 1)); process.exit(1); }
  throw e;
});
