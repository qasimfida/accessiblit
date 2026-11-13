import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const bytes = gzipSync(
  readFileSync(new URL('../dist/accessiblit.min.js', import.meta.url)),
).byteLength;
console.log(`IIFE gzip: ${bytes} bytes (warning 30000; limit 35000)`);
if (bytes >= 30000)
  console.warn('IIFE gzip has reached the 30 KB warning budget.');
