import { rmSync } from 'node:fs';
// Clean once before parallel format builds so one format cannot delete another.
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
