import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const bytes = readFileSync(
  new URL('../dist/accessiblit.min.js', import.meta.url),
);
console.log('sha384-' + createHash('sha384').update(bytes).digest('base64'));
