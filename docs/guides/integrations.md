# Delivery and integration contracts

The package has zero runtime dependencies. Its core exports `init`, `destroy` and TypeScript types; React is an optional peer (`>=17`) needed only for `/react`. Choose one core delivery format per document. The React entry imports that core rather than embedding another engine.

| Consumer       | Entry                                           | Declarations             |
| -------------- | ----------------------------------------------- | ------------------------ |
| ESM            | `dist/index.mjs`                                | `dist/index.d.ts`        |
| CommonJS       | `dist/index.cjs`                                | `dist/index.d.cts`       |
| Classic script | `dist/accessiblit.min.js`, global `Accessiblit` | core types for authoring |
| React ESM      | `dist/react.mjs`                                | `dist/react.d.ts`        |
| React CommonJS | `dist/react.cjs`                                | `dist/react.d.cts`       |

All JavaScript files have adjacent sourcemaps. Both React files start with a `"use client"` banner. Conditional exports select types before the runtime target within each import/require branch. A typesVersions mapping also supports legacy resolution of `/react`. Package metadata is available at `@qasimfida/accessiblit/package.json`.

## Classic script and integrity

Load the local build as demonstrated in `examples/html/index.html`, then call `Accessiblit.init()`. Loading a second copy releases the old global instance; call init on the new namespace to mount it. Loading after DOMContentLoaded is supported. The script creates only the Accessiblit window namespace and never mounts automatically.

Run `node scripts/sri.mjs` after building to get the SHA-384 integrity value for that exact IIFE. Paste it into the script tag's integrity attribute; cross-origin script tags also need `crossorigin="anonymous"` and a server that permits the request. Pin a package version in any CDN URL. This project is not published by the agent: the CDN-shaped consumer test intercepts its URL and serves the packed local artifact, without claiming live CDN availability.

For strict CSP, supply the owner's nonce to init for fallback style elements and apply the site's normal nonce policy to its own script tags. Custom cursor data URIs retain the documented img-src fallback behaviour. No runtime request, font download or new storage key is introduced by packaging.

## React ownership

Mount one AccessiblitWidget per document, or call useAccessiblit from one owner. The component renders null on the server and mounts after commit. It memoizes unchanged props so an unrelated parent rerender preserves an open panel. Keep nested options (arrays, message objects and callbacks) stable when their meaning has not changed.

The hook returns a ref whose current value is null before its effect commits and after cleanup. Read it in handlers/effects; changing a ref does not cause a render. Memoize the options object passed to the hook. A changed options identity deliberately replaces the instance. Cleanup destroys the instance owned by that effect, so stale cleanup cannot destroy a later instance. These patterns follow [React's effect lifecycle](https://react.dev/reference/react/useEffect); real StrictMode and renderer checks cover React 17, 18 and 19.

The Vite example demonstrates both the helper and the brief's direct useEffect with init and destroy. They are alternative owners, not simultaneous widgets. Importing both the helper and core with consistent ESM resolution retains one core module; the CJS helper similarly requires the CJS core. Mixing IIFE and npm, or ESM and CJS engines in one document, is outside this ownership guarantee.

## Next App Router

Keep the page/layout as Server Components. Put the widget in a small file declaring `'use client'`, as in `examples/nextjs/app/widget.tsx`, and import that component from the server page. Define function options such as onChange inside the client boundary rather than sending them as server props. This follows the [Next client-boundary contract](https://nextjs.org/docs/app/api-reference/directives/use-client).

The example builds with the real production webpack pipeline and serves with next start. Framework telemetry is disabled by the smoke harness; no remote font helper is used. Vite may warn that client directives are irrelevant when bundling a standalone SPA; Next consumes the boundary marker.

## Packed consumers and checks

`npm run test:examples` builds, packs, installs every example into fresh temporary directories, compiles consumer declarations, builds Vite and Next, runs real browsers and removes the temporary installs. It uses no symlinks or source aliases. Browser audits exercise the local script tag, intercepted CDN snippet, ESM position option, React component/effect ownership and Next hydration. The separate Node consumer works with neither React nor its type declarations installed.

To run an example manually, build and pack from the root into examples, rename the archive to `examples/accessiblit.tgz`, then install in the selected example directory. Use a fresh install when replacing this development archive at the same 0.0.0 version. Framework versions are pinned; fresh example installs resolve their transitive dependencies, while the repository's own development dependencies are locked in package-lock.json.

The bundle audit proves unused JavaScript imports leave only a consumer constant and that a combined React/core ESM consumer has one of each entry. Using init intentionally retains all eighteen built-in features. Its source-map byte attribution is approximate for minifier boundaries; gzip is measured for the complete IIFE, never by summing independently compressed parts. Legacy React renderer tests run in a bounded worker so their scheduler ports cannot hold the smoke CLI open.
