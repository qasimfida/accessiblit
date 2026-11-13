# Phase 6 — Packaging and integrations

Status: PASS WITH NOTES

Date: 2026-11-13. Commit range: `phase-5-complete` (`5d27b08`) to `phase-6-complete`. The completion tag identifies the final report commit.

## Summary

All requested delivery formats and the separate React entry build from a clean install. Packed consumers exercise script tags, the CDN-shaped snippet, ESM, CJS, React helpers, the direct React effect pattern, Next App Router and plain Node SSR. The core remains free of runtime dependencies; React is an optional host-owned peer for `/react`.

Preflight: read AGENTS.md completely, including continuous commit rules. Main was clean; `git pull --ff-only` reported already up to date; `phase-5-complete` resolved to `5d27b0898ab93bc5fe19e1a6d6d5f21a6d7068ad`. No placeholder constants. Node 24.13.0, npm 11.6.2, git 2.50.1. All work remained on main, with fast checks before each granular commit.

## What changed (files and why)

- `tsup.config.ts` and `scripts/clean-dist.mjs`: clean once before parallel builds; emit ESM, CJS and the correctly named IIFE, adjacent maps and both declaration module kinds. Old browser filename references in tests and size checks were updated. IIFE reload releases the previous global instance before replacing its namespace.
- `src/react/index.ts`: client-only component and hook, importing the external core package rather than embedding its engine. Owned instance cleanup survives StrictMode and stale cleanup. The memoized component preserves an open panel across unchanged props. Hook options identity deliberately controls replacement; its ref is null before commit and after cleanup.
- `package.json` and lockfile: typed conditional exports for root and `/react`, `/package.json`, main/module/types, unpkg/jsdelivr, intended files, sideEffects, Node engines, keywords, public publish metadata and optional React peer. `verify` now includes publint and attw. Each import/require branch puts types before its runtime target; typesVersions supports legacy `/react` declaration resolution.
- `src/features/dom.ts`: closing-gate performance fix uses one pruned traversal and avoids child arrays, preserving ordering and hidden/private/graphical exclusions in explicit tests.
- `scripts/sri.mjs`: prints SHA-384 for the exact browser artifact; packed-byte equality is tested.
- `examples/`: local script tag, React/Vite component and direct effect, ESM position snippet, real Next App Router server/client boundary, Node ESM/CJS without React, and strict consumer type projects. All manifests install a local archive, not a linked source tree.
- `scripts/test-examples.mjs` and small helpers: fresh temporary consumers, real tarball installs with symlink checks, two TypeScript resolution modes, SSR, React 17/18 renderer compatibility, Vite/Next production builds, three-engine browser checks, axe, keyboard/pointer ownership checks and cleanup. The legacy renderer sandbox is a bounded worker, so framework scheduler ports cannot keep the CLI alive after its assertions.
- CI adds the complete packed smoke command after browser installation on Node 20 and 22. Permissions remain contents: read. Integration guide documents ownership, CSP, SRI and limits. Ignore rules cover development archives and Next artifacts.

## Verification (commands run, real results)

| Command / scenario                            | Observed result                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                      | 299 packages installed; zero reported vulnerabilities                                                                                                                            |
| Remove dist, then `npm run verify`            | Pass: lint, strict typecheck, unit coverage, all formats, plain Node SSR, size, publint and attw                                                                                 |
| Unit tests                                    | 169 passed across 54 files; global 95.93% lines / 90.08% branches; core 98.63% lines / 97.96% branches                                                                           |
| `npm run test:examples` with evidence enabled | Pass from fresh tarball installs; all 15 browser/format combinations, 30 axe scans, no page/console errors                                                                       |
| Headed smoke with `ACCESSIBLIT_HEADED=1`      | Same 15 combinations and 30 scans pass, including native pointer unmount/remount actions                                                                                         |
| Consumer TypeScript                           | Node16 ESM and CJS, Bundler ESM/TSX; strict, noUncheckedIndexedAccess, skipLibCheck false, no source aliases                                                                     |
| Core TypeScript without React/types           | Pass in isolated Node example                                                                                                                                                    |
| Plain JS consumers                            | CJS require, ESM import, package.json subpath and SSR pass; optional React package demonstrably absent from core consumer                                                        |
| React compatibility                           | 17.0.2 legacy renderer and 18.3.1 createRoot under StrictMode restore exact markup; SSR empty. React 19.3.1 real StrictMode, hook ownership and unchanged-props regressions pass |
| Next App Router                               | Next 16.4.6 webpack production build/start pass; server HTML contains server text but no mounted widget; hydration and unmount/remount pass                                      |
| `actionlint .github/workflows/ci.yml`         | Pass, actionlint 1.7.12                                                                                                                                                          |
| `npm audit`, `npm audit --omit=dev`           | Zero vulnerabilities in both                                                                                                                                                     |
| Full three-engine regression                  | 687 passed, 6 instrumentation skips, 0 failures in 7.3 minutes after the fixes                                                                                                   |

Publint reports “All good”; attw reports no problems for root, React and package.json across node10, node16 CJS/ESM and bundler resolution. These are package-resolution results, not a claim to support Node 10 at runtime. The declared minimum remains Node 20.19.0; Next's checked engine minimum is 20.9.0. Node 20.20.2 also passes verify and the complete packed example command locally; Node 22 remains configured for CI rather than locally executed.

The brief's three snippet shapes are exercised with current names: `Accessiblit.init()` after the classic CDN script URL; `import { init } from '@qasimfida/accessiblit'` with bottom-left position (measured launcher x below 50 px); and useEffect calling init with destroy cleanup. Live CDN publication is intentionally not attempted: its exact request is intercepted with the packed IIFE.

Raw evidence: [final packed examples and bundle audit](assets/phase-6/examples.json), [headed example run](assets/phase-6/headed-examples.json), and [screenshots](assets/phase-6/). The headed file precedes the performance-only R-6 traversal change; the final examples file records the latest artifact on Node 20, including the bundle audit. Adapter and panel code are identical between those runs. The [full regression measurements](assets/phase-6/regression.json) include the first-run performance failure, repeated post-fix timings and final runtime/cleanup results.

### Pack dry-run file list

`npm pack --dry-run --json` lists exactly these 17 files; the smoke test asserts the allowlist and installs the resulting archive:

```text
LICENSE
README.md
dist/accessiblit.min.js
dist/accessiblit.min.js.map
dist/index.cjs
dist/index.cjs.map
dist/index.d.cts
dist/index.d.ts
dist/index.mjs
dist/index.mjs.map
dist/react.cjs
dist/react.cjs.map
dist/react.d.cts
dist/react.d.ts
dist/react.mjs
dist/react.mjs.map
package.json
```

No tests, reports, examples, scripts, environment files, credentials or node_modules are in the archive. Source text embedded in intended sourcemaps is the library's own src code.

### Integrity

`node scripts/sri.mjs` prints the following value; the smoke command independently hashes the installed tarball's IIFE and asserts equality:

```text
sha384-xYg7qrH85XyZGuJfqIR72RplNKnc3hBgHWIZwZnfe+YUZCFaThDonyMbgaMegfgy
```

Recompute after any browser artifact change.

## Review findings and fixes

| Severity | Finding                                                                                            | Fix                                                                                                                                                                                                | Status |
| -------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| High     | R-1: repeating the classic script replaced the namespace but left the previous engine mounted      | `bf9a67f`: guarded release before replacement; reproduced failure then three-engine reload/late-load/global-key test passes                                                                        | Fixed  |
| High     | R-2: React unit resolution depended on an existing dist directory, breaking clean-clone test order | `f56b088`: source-only Vitest self-import mapping, matching TypeScript. Dist removed before successful typecheck/tests; packed consumers retain real exports resolution                            | Fixed  |
| High     | R-7: Node 20 lacks navigator required by the legacy browser-renderer sandbox                       | `103067d`: provide/restore jsdom navigator in the worker. Reproduced ReferenceError on Node 20.20.2; final complete packed smoke passes there                                                      | Fixed  |
| Medium   | R-3: unchanged component props replaced the host and closed an open panel                          | `8ff93fd`: memoized component; failing host-identity/open-state test now passes                                                                                                                    | Fixed  |
| Medium   | R-4: axe auxiliary tabs could leave headed Firefox native input targeting an inactive page         | `1f5ef8b`: explicitly foreground the page after scans, assert document focus, bound input waits and stop the walk at Reset; real pointer actions retained and all cases pass                       | Fixed  |
| Medium   | R-6: full WebKit budget test reached exactly 100 ms to the next frame                              | `0733093`: filtered TreeWalker prunes excluded branches once; direct child traversal avoids arrays. New exclusion/order tests and nine repeated browser cases pass the unchanged under-100-ms gate | Fixed  |
| Low      | R-5: Next normalized the example compiler config on every build                                    | `9c92513`: declare the observed automatic JSX/runtime and generated-type settings without changing strictness; final production smoke succeeds                                                     | Fixed  |

Review against AGENTS.md sections 2, 7 and 9 found no remaining Blocker, High or actionable Medium issue. No size, coverage, lint, axe or package gate was reduced. The CommonJS fixture has a narrow require allowlist for Node builtins and the package API so it can test the requested native require syntax; TypeScript/runtime rules elsewhere remain active.

Development checks exposed and corrected test-harness issues as well: axe needs an explicit browser context; legacy renderer scheduler ports need sandbox lifetime management; and Vite ES library output preserves absolute source-path comments. Tree-shaking now asserts the actual surviving module graph and executable output, rather than mistaking comment metadata for retained library code. Its original executable-size bound remains in place. The prematurely hanging legacy-renderer command was terminated after its assertions completed; the worker-based complete command subsequently exits 0.

## Audits

### Accessibility

Headed Chromium, Firefox and WebKit walked the installed examples at 320 × 256. Alt+A opened the named non-modal dialog, Tab visited controls through Reset, Esc returned focus to the launcher, and reopening left Close visibly focused. WebKit uses platform Option+Tab to reach all controls. React owner buttons and the Next client button were clicked to unmount/remount; the direct effect snippet also mounted and destroyed successfully. There is one host throughout mounted states and none after unmount. The completed harness produced 21 tab stops through Reset in every example/engine pair. No dedicated browser connector was available; real headed Playwright performed the walk.

All 15 example/engine pairs have **0 axe violations closed and open** (30 scans), with zero page/console errors. Minimum measured widget target: **24 × 24 px**; focus outline **3 px**; panel horizontal overflow **0 px**. Observed launcher colours are white on rgb(20, 86, 160), giving **7.32096843:1** contrast. Representative Next and React screenshots were visually inspected: the compact panel scrolls vertically and the focused Close button remains visible.

| Widget criteria touched or retained | Result                  | Evidence                                                                                                                            |
| ----------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1, 1.3.1, 1.4.1                 | Pass in tested states   | Hidden decorative SVG, named groups and controls, native checked/pressed states, no colour-only meaning                             |
| 1.4.3, 1.4.11                       | Pass in tested states   | Thirty packed-widget axe scans; measured launcher contrast and focus/target geometry; broader regression covers all-feature colours |
| 1.4.4, 1.4.10, 1.4.12               | Pass on tested fixtures | 320 × 256 packed pages with zero horizontal panel overflow; retained scale/spacing/system-mode regressions                          |
| 1.4.13                              | N/a                     | No tooltips                                                                                                                         |
| 2.1.1, 2.1.2, 2.1.4, 2.4.3          | Pass on tested fixtures | Modifier shortcut, native tab/radio patterns, non-modal behaviour; complete keyboard regression retained                            |
| 2.4.7, 2.4.11                       | Pass on tested fixtures | Visible 3 px focus, Esc focus return, no hidden focused Close; retained host-focus/obstruction tests                                |
| 2.5.3, 2.5.7, 2.5.8                 | Pass in tested states   | Visible labels match names; no drag-only interaction; 24 px measured minimum                                                        |
| 4.1.2, 4.1.3                        | Pass in tested states   | Named dialog and native controls; retained announcement/reset tests; no extra server-rendered widget markup                         |

The React adapter itself renders no visible UI and introduces no extra semantic wrapper. Semantic inspection found the existing named launcher/dialog/groups and no duplicate accessible widget. Actual screen-reader speech, physical mobile and OS-drawn cursor checks remain human work; this is not a whole-site compliance claim.

### Security and privacy

Core runtime dependencies remain absent. React is external and optional; installing/importing the core requires neither React nor its types. No new runtime network API, cookie, storage key, unsafe DOM API or analytics was added. IIFE reload calls only the old namespace's guarded cleanup. SRI uses Node crypto at build time. Pointer/focus settings and privacy rules are unchanged.

Root npm audit (including development dependencies) and omit-dev audit both report zero vulnerabilities. Four new development dependencies are justified: react exercises hook/component execution; react-dom supplies actual client/server renderers; @types/react provides hook/component declarations; @types/react-dom checks the renderer tests. Their pinned versions were checked against npm's stable versions when installed (19.3.1 runtime pair, 19.3.0 type pair). Existing build/lint/test/size/package tools remain used. The root lockfile is committed and fresh npm ci passes.

Example applications own React/ReactDOM and Next; they are not runtime dependencies of this library. Exact top-level example versions are pinned and their temporary installs produce local locks. Framework telemetry is disabled during smoke build/start. No secrets were read or committed; package contents use an asserted allowlist. CI keeps contents: read and adds no secret echoes. MIT license text, 2026 author line, repository/bugs/homepage and package constants remain correct.

### Performance and size

The IIFE contains **57,294 raw bytes / 19,404 gzip bytes**, versus Phase 5's 19,255 gzip bytes: **+149 bytes**. This is below the 30,000 warning and 35,000 limit, with 15,596 bytes of budget remaining. React code and framework code are excluded from that bundle.

| Source-map attribution | Raw minified bytes | Contents                                                                           |
| ---------------------- | -----------------: | ---------------------------------------------------------------------------------- |
| Core                   |             14,292 | lifecycle, options/schema, store/storage, registry, host, sheets and announcements |
| Features               |             24,681 | all eighteen modules and helpers, page CSS and original cursor data URIs           |
| UI                     |             17,566 | launcher, panel, controls, keyboard, positioning and shadow styles                 |
| Public entry           |                140 | exported init/destroy glue                                                         |
| Wrapper/unmapped       |                615 | build scaffolding, reload guard and unmapped ranges                                |
| Total                  |             57,294 | full browser artifact                                                              |

This is source-map attribution of raw bytes, approximate at minifier boundaries; per-part gzip sizes are not additive. Both React sourcemaps contain only src/react/index.ts, with no overlap with core sources; the IIFE has 54 library source modules and no React/third-party module. React ESM is **384 bytes**, CJS **838 bytes**, excluding their maps and external React/core.

The unused JavaScript consumer retains only `var e = 1; export { e as retained };`, with one consumer entry and zero library modules. A combined React/core consumer has exactly **one index.mjs and one react.mjs module**. Core init intentionally retains all eighteen built-in features. Native CJS self-require resolves the matching CJS core rather than embedding a second engine.

IIFE window keys added: **["Accessiblit"]**, checked using Object.getOwnPropertyNames in all three engines. Late loading after readyState complete works; repeat loading removes the earlier host, permits a fresh init and restores exact DOM on destroy. No automatic mount occurs just from loading the script.

Production IIFE init over ten cycles per engine: chromium max init 4.600 ms, CLS 0; firefox max init 7.000 ms, CLS unavailable; webkit max init 6.000 ms, CLS unavailable. Every maximum is below 50 ms. Layout-shift entries are unsupported in Firefox/WebKit, so their CLS is unavailable. All three engines measure a 0 × 0 mount and exact DOM restoration. Final full-run WebKit 5,000-node timings peak at 61 ms synchronous / 76 ms to the next frame; all six levels pass unchanged bounds. The final full suite also retains balanced 224/224 listener additions/removals and exact all-feature reset/destroy cleanup in each engine.

## Known limitations (honest)

- Live CDN availability is not tested or claimed for this unpublished 0.0.0 version. Browser routing proves the snippet against packed bytes; the human alone publishes.
- Use one delivery format and one owner per document. Mixed IIFE/npm or ESM/CJS module graphs are outside the shared-engine guarantee. Same-format React/core sharing is tested.
- Effect-based integrations initialize after commit/hydration; they cannot suppress a host paint that occurs before init. No pre-init paint suppression is claimed for delayed loading.
- Hook options identity and nested component option references should remain stable when their meaning is unchanged; deliberate changes replace the instance. The ref becomes available after commit and does not trigger rerendering.
- Next was tested through its real production webpack pipeline. Other framework/bundler versions, Turbopack and Windows development scripts were not exercised locally. Linux matrix jobs and Node 22 execution remain delegated to configured CI; local Node 20.20.2 smoke/verify pass.
- Example transitive dependencies are freshly resolved in disposable installations; their changing archive integrity is not pinned in committed example locks. Repository development dependencies remain locked. Reinstall fresh when replacing the same development tarball version.
- Vite may warn that use-client directives are ignored for a standalone SPA; the client boundary is consumed by Next, whose build/hydration pass. Legacy React schedulers are isolated test infrastructure, not bundled library resources.
- Desktop engines and emulation do not replace physical mobile, screen-reader or real host-site testing. Existing feature limitations for iframes, shadow internals, canvas, author CSS and media remain documented in architecture and earlier reports.

## Deviations from the prompt (and why)

Closing review also changes the shared content traversal because the retained 5,000-node WebKit test reached exactly 100 ms. Optimizing enumeration adds measured headroom without changing timing thresholds, exclusions, feature values or styles. The first full run had 686 passes, 6 instrumentation skips and that one failure; the old isolated recheck passed at a 74 ms frame maximum, showing tight scheduling headroom. After optimization, nine repeated cases (three per engine) peaked at 47.5 ms Chromium, 40 ms Firefox and 77 ms WebKit. Final full-run results are reported separately, rather than hiding the first failure.

The public root contract is unchanged. React's previously unspecified helper contract is now explicit: component accepts AccessiblitOptions; hook returns a nullable owned instance ref, not a value that causes rerenders. React is an optional peer >=17, external to the core and wrapper bundles.

The CDN-shaped request is intercepted because publishing is prohibited by AGENTS.md and no live release is assumed. Example archives and installed/build output are disposable; only their source, measurements and screenshots are committed. Root build SSR checking is a separate local-artifact script so verify can run before packing, while the example itself resolves the installed package name. Package checks were already dependencies and are now part of verify rather than adding duplicates.

## Handoff notes for the next phase

Keep integration scripts in CI when changing exports, build output or lifecycle ownership. Run node scripts/sri.mjs after each browser build. Preserve React externals and types-first per-format resolution. Human next steps: inspect Node 20/22 CI results, test VoiceOver/NVDA speech and physical mobile, then continue the next phase. Publishing remains manual and was not performed.

## Phase commit list

```text
8e0087d docs(audit): record packed consumer and regression evidence
103067d fix(compat): supply navigator to legacy renderer sandboxes
0733093 perf(content): prune excluded subtrees during text traversal
d29ec75 docs(integrations): explain delivery and framework ownership contracts
9c92513 fix(next-example): declare the compiler settings used by its build
3613114 ci(examples): smoke-test tarball integrations on both Node versions
c5868e3 test(bundles): audit packed tree shaking and shared core ownership
4513345 test(react): exercise older peers and server consumers from tarballs
1f5ef8b fix(examples): restore native focus after axe analysis tabs
8ff93fd fix(react): preserve the panel across unchanged component props
f56b088 fix(tests): resolve React self imports before artifacts exist
e5ef963 test(examples): install and exercise packed delivery consumers
99dd638 test(consumers): assert packed type contracts and CDN markup
be540bb docs(examples): demonstrate the App Router client boundary
f33da8e docs(examples): demonstrate packed React and ESM browser consumers
c54d2c2 test(ssr): separate local build checks from packed Node consumers
cbf3fda chore(examples): ignore packed archives and Next build artifacts
25c6526 docs(examples): demonstrate the local packed script-tag delivery
bf9a67f fix(iife): release the previous engine when reloading the script
8891ccf build(sri): print the browser artifact SHA-384 integrity value
1efdecb build(package): expose typed core and optional React subpaths
0ceb14a feat(react): add an isolated client entry with owned effect cleanup
f00bca5 build(formats): emit the named minified browser delivery

```

This report is committed separately as `docs(report): record phase six packaging audit`; the completion tag includes that final documentation commit.
