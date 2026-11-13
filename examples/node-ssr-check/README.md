# Plain Node consumer

Build and pack from the repository root, rename the archive to `examples/accessiblit.tgz`, then run `npm install` and `npm test` here. This installs a real tarball, imports ESM, requires CJS and package metadata, and proves SSR imports avoid browser globals. React is deliberately absent. The root build's separate `scripts/check-ssr.mjs` checks local artifacts before packing.
