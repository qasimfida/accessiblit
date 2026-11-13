import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  // PAGES_URL is a project site, so assets must work beneath the repository path.
  base: '/accessiblit/',
  appType: 'mpa',
  build: {
    target: 'es2019',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        [
          'index.html',
          'install/index.html',
          'options/index.html',
          'faq/index.html',
          '404.html',
        ].map((path) => [path, fileURLToPath(new URL(path, import.meta.url))]),
      ),
    },
  },
});
