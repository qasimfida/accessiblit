import { rm } from 'node:fs/promises';
for (const path of ['dist', 'coverage', 'test-results', 'playwright-report']) {
  await rm(path, { recursive: true, force: true });
}
