import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { exampleEnv } from './process.mjs';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};
/** Bind an ephemeral loopback port so examples cannot collide with a developer's server. */
export async function serve(directory) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
      const file = resolve(
        directory,
        '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname),
      );
      if (!file.startsWith(resolve(directory) + sep))
        throw new Error('Outside example');
      const bytes = await readFile(file);
      response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
/** Start the actual production App Router server, and reap it on every exit path. */
export async function nextServer(directory) {
  const reservation = await serve(directory);
  const url = reservation.url;
  await reservation.close();
  const child = spawn(
    'npm',
    ['start', '--', '--hostname', '127.0.0.1', '--port', new URL(url).port],
    {
      cwd: directory,
      env: exampleEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    },
  );
  let log = '',
    exited = false;
  child.stdout.on('data', (bytes) => {
    log += bytes;
  });
  child.stderr.on('data', (bytes) => {
    log += bytes;
  });
  child.once('exit', () => {
    exited = true;
  });
  const close = async () => {
    if (exited) return;
    process.kill(-child.pid, 'SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  };
  try {
    for (let i = 0; i < 120; i++) {
      if (exited) throw new Error(log);
      try {
        if ((await globalThis.fetch(url)).ok) return { url, close };
      } catch {
        /* Server is still starting. */
      }
      await delay(250);
    }
    throw new Error('Next server did not start: ' + log);
  } catch (error) {
    await close();
    throw error;
  }
}
