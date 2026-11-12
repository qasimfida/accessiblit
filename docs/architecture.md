# Core runtime architecture

Phase 2 adds a shadow-local launcher and non-modal panel to the engine. `open`, `close` and `toggle` control the panel, including a queued open before body exists. Position, offset, z-index and shortcut options drive the UI. Real catalogue features remain for later phases; empty production groups explain that no options are available. The optional font URL is validated and never fetched.

## Initialization and teardown

`src/index.ts` owns one lifecycle controller. An import only creates ordinary JavaScript closures and maps; it never inspects browser globals. Without a DOM, `init` returns an inert instance with fresh default state. The build runs a plain Node check against `dist/index.mjs` and CJS while a throwing `window` getter proves imports do not inspect it.

A browser init destroys the previous instance, resolves options, reads validated preferences and applies registered effects synchronously on html. It does this before mounting the shadow host, including before body exists. Only the host waits for DOMContentLoaded. This avoids a deliberate deferred frame for initial preferences; a script loaded after a site's first paint cannot undo that earlier paint.

Each instance owns teardown scopes. Resources release once, in reverse order, and a failing cleanup does not prevent remaining cleanup. Old instance handles cannot destroy a newer instance. Destroy removes owned DOM, sheets and listeners and restores managed html attributes, including original serialization when no unrelated host edits remain. Stored preferences intentionally survive destroy. A host that disables or replaces DOM removal APIs can prevent exact cleanup; the runtime catches and reports those failures.

## Features and styles

Feature metadata declares id, group, label, description and control. `apply(value, api)` returns cleanup. The internal registry supports register/enable/disable, reapplication and replacement; the package entry still exports only runtime `init` and `destroy`. Fake features live exclusively under tests and are imported by development fixtures, never the production entry. The panel fixture supplies four metadata records to exercise range, select and toggle renderers across all three groups.

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

A shadow-local stylesheet keeps the host fixed at zero size and a polite, atomic `role=status` region visually clipped to 1px. Repeated messages clear and set text in a task so assistive technology can notice them; only the latest queued message is spoken. Messages use textContent, are capped at 512 code units, and pending tasks are cancelled on destroy. The UI uses this same region for metadata-derived changes (for example Font size 120 percent) and reset. Rapid changes coalesce to the latest message; actual assistive-technology speech still needs manual testing.

## Launcher, panel and feature controls

The 48px launcher is a real named button with a decorative inline SVG, `aria-expanded` and `aria-controls`. The panel has `role="dialog"`, `aria-modal="false"`, an explicit localized `aria-label`, a matching visible heading and an introduction. An explicit label avoids a Firefox crash observed when Playwright resolves a title reference after a closed-state axe scan; no axe rule or browser is excluded.

Three named sections contain registry-driven controls. Feature labels/descriptions come from metadata unless messages override them. Toggles expose pressed state and visible On/Off text; ranges expose visible values with labelled Decrease/Increase buttons; option lists use native radios with a shared name. The UI never switches on a concrete feature id. Optional metadata units and option labels format visible values and announcements. Invalid control metadata is isolated and logged once rather than breaking the host.

Opening focuses Close. Escape and explicit Close return focus to the launcher. Ordinary Tab order is retained without a trap; native radio arrows select options. Focusing host content closes the panel without stealing the host destination. A launcher overlapping the focused host target hides until focus moves, with the shortcut still available. The default modifier shortcut matches physical KeyA, not a layout-dependent key string. Custom modifiers and `false` are supported; repeat, IME composition and AltGraph do not toggle the UI. Site or operating-system shortcuts may conflict, so owners can change or disable it.

All listeners, the root/body attribute observer, popovers and owned styles are scoped to the instance and removed on destroy. There is no animation, focus trap, modal backdrop or runtime request. Destruction while a control is focused removes that control; it does not promise to restore an earlier arbitrary host focus destination.

## UI styling, page effects and reflow

A separate owned shadow sheet defines local palette tokens and resets inherited typography, spacing and text transforms. Geometry uses pixels so root text scaling does not recursively resize the controls. Logical CSS supports inherited direction; the four named positions remain physical corners. Offset clamping reserves focus-ring clearance. Panels are at most 360px wide, fit the visible viewport, scroll vertically and keep keyboard targets inside the scrollport. Controls aim for 44px; native radio inputs are 24px within larger labelled rows. The focus ring is 3px with a 3px offset. Reduced motion removes transitions, and system light/dark preferences select the palette. Forced-colour mode uses paired Canvas/CanvasText colours: WebKit dark ButtonFace/ButtonText can be translucent, so those pairs are unsuitable as a guaranteed opaque surface.

The launcher and panel use manual native popovers for the non-modal top layer. This escapes many ancestor painting/clipping effects. Root CSS zoom still scales top-layer boxes, so the controller measures the launcher and compensates author zoom through its owned sheet; it does not cancel browser zoom. VisualViewport resize/scroll signals keep controls reachable during mobile pinch zoom. `zIndex` is applied, but ordinary document stacking cannot override top-layer order.

**Feature-author constraint:** page colour filters must target page content, excluding the widget host, for example `html.accessiblit-monochrome body > :not([data-accessiblit-host])`, rather than putting `filter` on html or body. The html class still drives the single page stylesheet. A root-filter prototype changed UI pixels in Firefox even with native popovers; filtering only content preserved the UI in all three tested engines. Future filter features must account for fixed/sticky positioning and stacking contexts created by filtered containers. Do not claim arbitrary author filters on html are isolated.

Native-popover failure or older browsers use fixed-position fallback. Ancestor transforms, clipping and filters can affect that fallback; later site top-layer dialogs can cover native surfaces too. Site rules aimed at the host, closed shadow trees, cross-origin frames, browser extensions and pathological layout constraints cannot be universally repaired. Tests cover 320px reflow, user text spacing, root author zoom and a separate Chromium mobile 400% pinch-zoom path. Real desktop toolbar zoom and screen-reader speech remain human checks.

## Content Security Policy

The runtime prefers constructed CSSStyleSheet objects and `adoptedStyleSheets` separately for the document and shadow root. It uses replaceSync and retains/removes only its own sheet, preserving host sheets. If unavailable or construction/update fails, it falls back to one owned style element in that tree. A document sheet is lazy and exists only when a feature adds page rules.

Pass `nonce` matching the site's response CSP when style elements need a nonce. The nonce is set before insertion on both page and shadow fallback styles. The runtime never generates a nonce, changes the site's policy, inserts a script, or adds per-element inline styles beyond managed html CSS variables. Script loading itself must satisfy the site's script-src policy; the options nonce does not retrofit a script tag that has already loaded.

Browser tests exercise both constructed sheets and forced style-element fallback with `default-src 'none'; script-src 'self'; style-src 'nonce-test-owner'; connect-src 'none'; base-uri 'none'`. Computed host/region styles and library CSP violations are checked before axe adds its own audit probes; axe violations are still asserted separately. Constructed-sheet behavior is measured in those engines, not a promise that every embedding policy, browser extension or future browser will allow it. A denied fallback without an appropriate nonce cannot provide the intended styling. The library makes no network requests to repair that condition.

References: [CSSStyleSheet replaceSync](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync), [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets), [CSP style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src).

## Verification and limits

Run `npm run verify`, then `npm run test:e2e` (browser tests require built dist), `npm run check:package`, `npm audit` and `npm audit --omit=dev`. Coverage requires at least 90% core lines and branches. Browser probes measure initialization, host dimensions, DOM restoration, network activity and Chromium CLS. Layout-shift entries are unavailable in the tested Firefox/WebKit engines, so those tests report null rather than claiming CLS measurement.

The tested Firefox 159 toolchain crashes when full axe instrumentation and Playwright semantic-tree/name traversal share some page states. The required closed/open media matrix passes with the explicit dialog label. The supplemental audit captures keyboard and semantic evidence independently, then uses a fresh page for full axe scans of active controls; no rule or required browser profile is disabled. Reproduce this tooling interaction separately before combining those audit passes. Run `ACCESSIBLIT_AUDIT_WRITE=1 npm run test:e2e -- e2e/panel-audit.spec.ts --headed --workers=1` to refresh committed screenshots, semantic trees and raw measurements; ordinary tests do not rewrite reports.

The keyboard fixture uses ordinary Tab navigation, and Option+Tab for macOS WebKit's native settings ([Apple's Safari shortcuts](https://support.apple.com/guide/safari/cpsh003/mac)). Fixture targets and contrast are audited; they are host test controls, not widget UI. Phase 2 browser tests add named roles/states, media/axe profiles, keyboard operation, UI geometry, content-filter isolation, author zoom, text spacing and small-view focus checks. Real feature effects, React integration and arbitrary host-site behavior remain later-phase work. Personalisation does not establish WCAG compliance.
