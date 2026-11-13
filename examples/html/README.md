# Script-tag example

From the repository root run `npm run build`, then `npm pack --pack-destination examples`. Rename the resulting archive to `examples/accessiblit.tgz`. In this directory run `npm install`, then serve this directory with a static HTTP server. Open `index.html`; the script loads the installed tarball's local IIFE and calls `Accessiblit.init()`.

For CDN delivery, replace the local script URL with the package's `dist/accessiblit.min.js` URL and paste the output of `node scripts/sri.mjs` into its integrity attribute. No CDN request is made by this local example. The repository's `npm run test:examples` automates packing, installation and browser checks in temporary directories.
