# Packed React and ESM examples

Build and pack the repository, rename the archive to `examples/accessiblit.tgz`, then run `npm install` and `npm run dev` here. Production smoke testing runs `npm run build` and serves the resulting dist directory.

The main page demonstrates the `/react` component and the brief's `useEffect` with `init` and `destroy`, switching between owners and unmounting. `/esm.html` exercises the plain ESM import with `position: 'bottom-left'`. React StrictMode stays enabled. Mount one owner per document. For `useAccessiblit(options)`, memoize options; the returned ref is null until the effect commits, and is cleared during cleanup.
