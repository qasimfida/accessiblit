import { rmSync } from 'node:fs';

for (const directory of [
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
]) {
  rmSync(new URL(`../${directory}/`, import.meta.url), {
    recursive: true,
    force: true,
  });
}
