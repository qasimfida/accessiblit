import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        esm: new URL('./esm.html', import.meta.url).pathname,
      },
    },
  },
});
