# Consumer contract checks

Install the packed archive as in the other examples, then run `npm test`. Both Node16 (ESM and CJS) and Bundler resolution compile declarations from the installed package, with no repository paths or skipLibCheck. Negative assertions catch widened FeatureId, position and change-event types; TSX exercises component and hook inference.

`cdn.html` is the brief's CDN-shaped script tag with `Accessiblit.init()`. The automated browser test intercepts that exact URL and supplies the tarball's IIFE: this proves the snippet without publishing or claiming this unreleased version is available on a public CDN. The Vite example covers the ESM position and React effect snippets.
