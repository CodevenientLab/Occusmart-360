import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const root = new URL(process.argv.includes('--dist') ? '../dist/' : '../src/', import.meta.url);
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const asset = assets.get(path);
  if (!asset) {
    response.writeHead(404).end('Not found');
    return;
  }

  const [name, type] = asset;
  try {
    const content = await readFile(new URL(name, root));
    response.writeHead(200, { 'Content-Type': type + '; charset=utf-8' }).end(content);
  } catch {
    response.writeHead(500).end('Asset unavailable. Run npm run build before serving dist.');
  }
}).listen(port, host, () => console.log(`Occusmart 360 running at http://${host}:${port}`));
