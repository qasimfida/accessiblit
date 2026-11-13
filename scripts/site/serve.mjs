import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  fileURLToPath(new URL('../../site/dist/', import.meta.url)),
);
const inside = (file) => file === root || file.startsWith(root + sep);
const base = '/accessiblit/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.map': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

/** Preview the built project path and real 404 behavior without exposing repository files. */
export function createSiteServer() {
  return createServer(async (request, response) => {
    const send = (status) => {
      response.writeHead(status);
      response.end();
    };
    if (!['GET', 'HEAD'].includes(request.method)) return send(405);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    let path;
    try {
      path = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
    } catch {
      return send(400);
    }
    if (path === '/' || path === '/accessiblit') {
      response.writeHead(308, { Location: base });
      response.end();
      return;
    }
    let code = 200;
    let file = resolve(
      root,
      path.startsWith(base) ? path.slice(base.length) : '404.html',
    );
    if (!path.startsWith(base)) code = 404;
    if (!inside(file) || path.includes('\\') || path.includes('\0'))
      return send(403);
    try {
      const details = await stat(file);
      if (details.isDirectory()) {
        if (!path.endsWith('/')) {
          response.writeHead(308, { Location: path + '/' });
          response.end();
          return;
        }
        file = resolve(file, 'index.html');
      }
      file = await realpath(file);
      if (!inside(file) || !types[extname(file)]) return send(403);
    } catch {
      file = resolve(root, '404.html');
      code = 404;
    }
    response.writeHead(code, {
      'Content-Type': `${types[extname(file)]}; charset=utf-8`,
    });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  });
}
