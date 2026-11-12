# Core runtime architecture

Phase 1 implements the engine and a hidden status region. It has no launcher, panel or real feature implementations. `open`, `close` and `toggle` reserve the public API and do nothing until UI exists. Position, offset, z-index and shortcut options are validated but have no visible effect yet. The optional font URL is validated and never fetched.

## Initialization and teardown

`src/index.ts` owns one lifecycle controller. An import only creates ordinary JavaScript closures and maps; it never inspects browser globals. Without a DOM, `init` returns an inert instance with fresh default state. The build runs a plain Node check against `dist/index.mjs` and CJS while a throwing `window` getter proves imports do not inspect it.

A browser init destroys the previous instance, resolves options, reads validated preferences and applies registered effects synchronously on html. It does this before mounting the shadow host, including before body exists. Only the host waits for DOMContentLoaded. This avoids a deliberate deferred frame for initial preferences; a script loaded after a site's first paint cannot undo that earlier paint.

Each instance owns teardown scopes. Resources release once, in reverse order, and a failing cleanup does not prevent remaining cleanup. Old instance handles cannot destroy a newer instance. Destroy removes owned DOM, sheets and listeners and restores managed html attributes, including original serialization when no unrelated host edits remain. Stored preferences intentionally survive destroy. A host that disables or replaces DOM removal APIs can prevent exact cleanup; the runtime catches and reports those failures.

## Features and styles

Feature metadata declares id, group, label, description and control. `apply(value, api)` returns cleanup. The internal registry supports register/enable/disable, reapplication and replacement; the package entry still exports only runtime `init` and `destroy`. Two fake features live exclusively under tests and are imported by the development fixture, never the production entry.

Use `api.styles` for page rules, `accessiblit-` classes and `--accessiblit-` variables. One owned document sheet contains all page-affecting rules. Root classes are reference-counted; variable overrides stack and restore prior values/priorities. Unrelated host attributes, classes and styles remain untouched. CSS variables are written only on html, as required by the root-variable design; feature code must not style individual host elements inline.

Use `api.listen` for event listeners and `api.onCleanup` immediately when acquiring any other resource. The registry also tracks style resources, so a throwing partial apply rolls them back. Direct mutations through `api.document` must have a registered cleanup before a later operation can throw. The engine cannot infer how to undo arbitrary unregistered feature mutations. Feature authors remain responsible for CSS specificity and deliberate content effects; no markup remediation is performed.

Feature failures are logged once per feature id per registry. Announcements during setup commit only after successful apply; disabled/failed feature APIs cannot announce. A healthy feature continues when another apply or cleanup fails.

## State and persistence

State uses the fixed 18-id catalogue and primitive, domain-validated values. Text/layout percentages default to 100; spacing and line-height off values are 0; alignment/font modes use `off`; toggles default to false. Content scale currently uses 10-point steps. Public state snapshots are copies.

The storage wire format is `{ "version": 1, "state": { ... } }`. Partial version-1 state fills missing values from defaults. Unknown versions, keys, invalid values, structured values and prototype-pollution keys are ignored rather than merged. Raw reads are capped at 4096 UTF-16 code units before JSON parsing and invalid external strings are discarded from the fallback. Valid serialized settings use a small fixed ASCII schema. Future schema versions need explicit migration; no legacy format is guessed.

Every localStorage getter/getItem/setItem call is inside try/catch and only the configured key is used. Blocked access or quota failure uses bounded validated state in a WeakMap keyed by Window and configured key. Dirty in-memory preferences survive reinit in that window. With `persist: false`, storage is never accessed and memory is local to the instance.

The store commits before notifying, queues reentrant changes, isolates callback exceptions and ignores unchanged values. Subscribe returns an unsubscribe function. Reset writes defaults under the same key, preserving all other site storage. Native storage events update other tabs without echo writes; key deletion and localStorage clear restore defaults. Session storage events are ignored.

`onChange` is opt-in and receives exactly `{ id, value }`, including changes received from other tabs and reset. Initial preference restoration does not invoke it. No identity, DOM content or full state snapshot is included. This narrows the extra `state` member in the Phase 0 placeholder type as Phase 1 requests; the section 5 option/instance shapes remain intact.

## Shadow host and announcements

The single body mount has `data-accessiblit-host` and an open shadow root. A foreign existing marker is preserved and a duplicate mount is skipped. DOMContentLoaded listeners are cancelled on teardown. Page styles can apply while waiting for body.

A shadow-local stylesheet keeps the host fixed at zero size and a polite, atomic `role=status` region visually clipped to 1px. Repeated messages clear and set text in a task so assistive technology can notice them; only the latest queued message is spoken. Messages use textContent, are capped at 512 code units, and pending tasks are cancelled on destroy. No focusable controls or keyboard interception exist in Phase 1.

## Content Security Policy

The runtime prefers constructed CSSStyleSheet objects and `adoptedStyleSheets` separately for the document and shadow root. It uses replaceSync and retains/removes only its own sheet, preserving host sheets. If unavailable or construction/update fails, it falls back to one owned style element in that tree. A document sheet is lazy and exists only when a feature adds page rules.

Pass `nonce` matching the site's response CSP when style elements need a nonce. The nonce is set before insertion on both page and shadow fallback styles. The runtime never generates a nonce, changes the site's policy, inserts a script, or adds per-element inline styles beyond managed html CSS variables. Script loading itself must satisfy the site's script-src policy; the options nonce does not retrofit a script tag that has already loaded.

Browser tests exercise both constructed sheets and forced style-element fallback with `default-src 'none'; script-src 'self'; style-src 'nonce-test-owner'; connect-src 'none'; base-uri 'none'`. Computed host/region styles and library CSP violations are checked before axe adds its own audit probes; axe violations are still asserted separately. Constructed-sheet behavior is measured in those engines, not a promise that every embedding policy, browser extension or future browser will allow it. A denied fallback without an appropriate nonce cannot provide the intended styling. The library makes no network requests to repair that condition.

References: [CSSStyleSheet replaceSync](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync), [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets), [CSP style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src).

## Verification and limits

Run `npm run verify`, then `npm run test:e2e` (browser tests require built dist), `npm run check:package`, `npm audit` and `npm audit --omit=dev`. Coverage requires at least 90% core lines and branches. Browser probes measure initialization, host dimensions, DOM restoration, network activity and Chromium CLS. Layout-shift entries are unavailable in the tested Firefox/WebKit engines, so those tests report null rather than claiming CLS measurement.

The keyboard fixture uses ordinary Tab navigation, and Option+Tab for macOS WebKit's native settings ([Apple's Safari shortcuts](https://support.apple.com/guide/safari/cpsh003/mac)). Fixture targets and contrast are audited; they are host test controls, not widget UI. UI conformance, real feature states, React integration and arbitrary host-site behavior remain later-phase work. Personalisation does not establish WCAG compliance.
