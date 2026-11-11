import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const bytes = gzipSync(await readFile('dist/index.global.js')).byteLength;
console.log(`IIFE gzip: ${bytes} bytes`);
if (bytes >= 30000)
  console.warn('Bundle is at or above the 30 KB warning threshold.');
