# Phase 7 — QA hardening

Status: BLOCKED

Date: 2026-11-13. Checkpoint source: `4532e80`; range starts at `phase-6-complete` (`a47a551`). Closing outcome: BLOCKED by R-17. CI evidence and audit artifacts are committed; `phase-7-complete` is deliberately withheld.

## Summary

The original CSP audit blocker was resolved after the human resumed work. Subsequent runs exposed lockfile, audit-harness, performance, focus and mobile RTL defects. R-1 through R-16 have separate guarded changes; the remaining timing failure is R-17. Local verify passes, and both CI verification jobs pass. The full browser matrix does **not** pass: macOS WebKit exceeds the unchanged 100 ms next-frame budget in seven cases across Node 20/22. After three performance-related approaches (coalesced geometry, removing redundant placement frames and the Safari-target port), AGENTS.md section 11 requires stopping and reporting the unresolved criterion. No retry or threshold change is used to hide it.

Preflight: AGENTS.md was read completely; main was clean; git pull --ff-only returned already up to date; phase-6-complete exists at a47a551682109f4bcc016a62fd0ac4b353b59533. No project constant contains YOUR_. Tools observed: Node 24.13.0, npm 11.6.2, git 2.50.1; an isolated clean installation also used Node 20.20.2/npm 10.8.2. Hardware: Apple M3 Pro, 18 GiB RAM.

The historical stopped report is preserved in commit 6500902, and [blocked-evidence.json](assets/phase-7/blocked-evidence.json) intentionally remains historical. No completion tag has been created.

## What changed (files and why)

- playwright.config.ts adds iPhone 13/WebKit and Pixel 7/Chromium emulation for qa-prefixed suites. All automatic retries are zero.
- fixtures/qa adds eight host variants: plain HTML, an independent shadow component, same-origin/opaque frames, strict CSP with constructed sheets and nonce fallback, 5,500 paragraphs, a high-z-index CSS modal and aggressive resets.
- e2e/helpers and qa-prefixed suites cover five media/direction profiles, every single maximum, 32 binary pairwise rows, all eighteen maxima, keyboard operation, 200 lifecycle loops, listener ownership and post-GC memory evidence. Pairwise coverage is checked for all 153 feature pairs and four default/maximum assignments.
- Letter spacing permits emergency wrapping in eligible semantic text blocks while active, preserving page markup and restoring owner styles when disabled. The long-token regression fails in all engines before the fix and passes afterwards.
- src/ui/controller.ts coalesces root/body geometry work, caches author zoom, cancels owned frames, tolerates temporary body removal and handles internal shadow focus on the shadow root. src/ui/viewport.ts caches the correct fixed inline viewport basis when mobile overflow expands innerWidth.
- tests/ui guards the discovered geometry and focus cases. The exhaustive flash test avoids temporary allocations while retaining all 16,777,216 colours and the original limits.
- package-lock.json restores two already-required optional dev-only WASI dependency records; no direct dependency or version changes.
- CI separates browser projects across Node 20/22, using Linux for Chromium/Firefox/Pixel and macOS for Safari-target WebKit/iPhone. Permissions remain contents: read, checkout does not persist credentials, and actionlint accepts the workflow.
- [The conformance matrix](../docs/ACCESSIBILITY.md), [human screen-reader script](../docs/manual-screen-reader-test.md) and [CSP guide](../docs/guides/csp.md) distinguish automated evidence from remaining human work. The table records scoped accessibility results and explicit human-only gaps; it does not turn a failed performance matrix into a phase pass.

## Verification (commands run, real results)

| Command / run                                  | Result                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latest npm run verify                          | PASS: lint, format, typecheck, 179 tests in 57 files, build, plain-Node SSR imports, size, publint and attw                                                             |
| Coverage                                       | Global 96.12% lines / 90.71% branches; core 98.63% lines / 97.96% branches                                                                                              |
| IIFE                                           | 19,603 bytes gzip; limit remains 35,000, warning remains 30,000                                                                                                         |
| Full local discovery matrix on f9c96b0 runtime | 1,169 passed, 15 failed, 9 skipped in 17.4 minutes; failures identified R-9, R-10 and R-11 below                                                                        |
| Post-fix keyboard matrix                       | 25 passed in 3.2 minutes; all eighteen announcements/configurations checked per case; no axe violations                                                                 |
| Post-fix Pixel RTL regression set              | 9 passed in 8.6 seconds, including all five previously failing cases                                                                                                    |
| Post-fix desktop viewport/zoom set             | 46 passed, 2 documented CDP-only skips in 16.2 seconds                                                                                                                  |
| Latest content timing/level set                | 42 passed in 15.8 seconds; 90 timing samples, maximum synchronous 18 ms, next-frame callback 55 ms                                                                      |
| Isolated Node 20/npm 10 npm ci                 | Before: missing @emnapi/core and @emnapi/runtime records. After: 297 packages installed, zero vulnerabilities                                                           |
| npm audit / npm audit --omit=dev               | Both zero vulnerabilities; zero runtime dependencies                                                                                                                    |
| actionlint .github/workflows/ci.yml            | PASS                                                                                                                                                                    |
| Full post-fix CI matrix                        | [FAIL on checkpoint 4532e80](https://github.com/qasimfida/accessiblit/actions/runs/43449963007): 2,367 passed, 7 failed, 18 skipped / 2,392 scheduled across Node 20/22 |

Earlier interrupted discovery runs and the original CSP stop are not clean matrix passes. Functional audit cases in Firefox are explicitly marked slow (90 seconds) for two axe traversals; the 50 ms init, 100 ms content, coverage, contrast, axe and size gates are unchanged.

### Complete CI results and remaining failure

The [current CI run](https://github.com/qasimfida/accessiblit/actions/runs/43449963007) executes 1,196 browser cases per Node version (45 files) with zero retries. All ten browser jobs ran to completion. Both verification jobs also pass: clean npm ci, lint/format, types, 179 unit tests, build, size, SSR, publint/attw, audit and all fifteen packed browser/format checks per job. Node 20 and 22 have matching 96.12% line / 90.71% branch coverage globally and core 98.63% / 97.96%.

| Project                          | Node 20                                   | Node 22                                   |
| -------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Chromium / Linux                 | 332 passed, 6.3 min                       | 332 passed, 5.5 min                       |
| Firefox / Linux                  | 328 passed, 4 skipped, 10.9 min           | 328 passed, 4 skipped, 7.8 min            |
| WebKit / macOS                   | 324 passed, 4 failed, 4 skipped, 11.2 min | 325 passed, 3 failed, 4 skipped, 11.5 min |
| iPhone emulation / macOS WebKit  | 99 passed, 1 skipped, 6.0 min             | 99 passed, 1 skipped, 6.7 min             |
| Pixel emulation / Linux Chromium | 100 passed, 2.8 min                       | 100 passed, 2.5 min                       |

| WebKit failing gate | Node | Maximum next-frame sample | Maximum synchronous sample |
| ------------------- | ---- | ------------------------: | -------------------------: |
| letterSpacing       | 20   |                    159 ms |                       5 ms |
| wordSpacing         | 20   |                    123 ms |                      10 ms |
| contentScale        | 20   |                    102 ms |                       2 ms |
| fontSize            | 20   |                    151 ms |                      48 ms |
| wordSpacing         | 22   |                    111 ms |                       8 ms |
| textAlign           | 22   |                    107 ms |                      29 ms |
| fontSize            | 22   |                    119 ms |                      46 ms |

All original synchronous and next-frame assertions remain `< 100`; no failing sample was discarded or averaged away. The raw rows and job links are in [ci-verification.json](assets/phase-7/ci-verification.json). No failed job was manually rerun. Earlier CI checkpoint 06949a6 had 2,320 browser passes, 48 failures and 18 skips; its functional/media failures motivated R-12 through R-16. Those results and the local discovery failures are historical, not clean passes.

Nine skips per Node version are explicit API limitations: precise heap sampling in Firefox/WebKit/iPhone (3), legacy CDP-only pinch zoom in Firefox/WebKit (2), legacy CPU tracing in Firefox/WebKit (2), and legacy heap tracing in Firefox/WebKit (2). No widget axe or required host/profile case is skipped. The five-profile host, pairwise, keyboard, CSP and isolation suites pass on every project. Phone projects run the qa-prefixed suites; they do not duplicate every desktop legacy test.

## Review findings and fixes

| Severity | Finding                                                                                                              | Fix                                                                                                                                                             | Status                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Medium   | R-1: external frame CSS caused an opaque-frame resource error                                                        | d2d5018: self-contained frame; qa-boundaries guard                                                                                                              | Fixed                                            |
| High     | R-2: axe copied nonce styles into detached documents without CSP authorisation                                       | b6c0ce4: authorise only audit-owned copies; strict nonce/CSP guards; no suppressed errors or rules                                                              | Fixed                                            |
| High     | R-3: existing main CI failed at npm ci because the lock omitted two required optional records                        | 86b1384: minimal lock repair; isolated red/green installation and existing CI npm-ci gate                                                                       | Fixed                                            |
| Medium   | R-4: a fully asserted Firefox audit exceeded the default wall timeout during contention                              | 6262faa: bounded slow annotation for multi-axe cases; original case passes in 6.5 seconds                                                                       | Fixed                                            |
| Medium   | R-5: exhaustive flash analysis allocated millions of temporary arrays and timed out                                  | 935196b: scalar squared distances, one square root; same exhaustive inputs and thresholds                                                                       | Fixed                                            |
| High     | R-6: placement forced host layout after every setting change, exceeding 100 ms                                       | f0be3b2: coalesced/cached geometry; unit and timing guards                                                                                                      | Fixed                                            |
| Medium   | R-7: placement queued an unnecessary third frame for two overlays                                                    | 8512ef2: observer-owned scheduling; exact two-frame and zero-off/destroy assertions retained                                                                    | Fixed                                            |
| Medium   | R-8: a temporary missing body threw during a new zoom-cache read                                                     | f9c96b0: null guard; public init/open red/green unit regression                                                                                                 | Fixed                                            |
| High     | R-9: Firefox crashed inside axe.runPartial when keyboard/semantic traversal and audit were interleaved               | 912fe2f: uninterrupted walk plus independent audit page; compare every saved state and actual control projection; five Firefox profiles pass                    | Fixed                                            |
| High     | R-10: document focus handling missed internal shadow transitions and a WebKit radio was partly clipped               | b67fb6f: shadow-root focus listener; scroll regression 0 to required 24 px; all 25 keyboard cases pass                                                          | Fixed                                            |
| High     | R-11: Pixel RTL overflow expanded innerWidth to 515 while the fixed viewport stayed 412, placing the panel at -67 px | 8239037: cached root client width; all four visual bounds; Pixel regressions now report left 36/right 396                                                       | Fixed                                            |
| High     | R-12: packed React remounts required immediate launcher visibility despite permitted host-focus protection           | 1a9829c: force overlap, assert hidden state, then prove mount uniqueness, shortcut access, Escape focus return and visibility; all 15 packed checks pass        | Fixed; both CI verification jobs pass            |
| High     | R-13: Linux font metrics overflowed a grid word at maximum spacing                                                   | 817fae0: scoped emergency wrapping while letter spacing is active; 90 spacing/combination checks pass, including a new three-engine red/green long-token guard  | Fixed                                            |
| High     | R-14: a tall enlarged-text control received only 4 px of focus clearance at one edge                                 | bb0a60c: balanced adaptive clearance; geometric regression and 19 viewport checks pass, with the original 6 px assertions                                       | Fixed                                            |
| High     | R-15: Linux WebKit media promises hang and its port misses timing limits                                             | 5d37ac2: run every WebKit/iPhone test on the Safari-target macOS port for both Node versions; Linux Chromium/Firefox/Pixel remain; no test or threshold removed | Media passes on macOS; timing remains R-17       |
| Low      | R-16: packed WebKit traversal assumed macOS Option+Tab on every OS                                                   | b7dcb2c: use ordinary Tab outside macOS; retain all focus assertions; packed checks pass locally                                                                | Fixed; both CI verification jobs pass            |
| Blocker  | R-17: macOS WebKit next-frame timing still exceeds 100 ms on 5,000 nodes                                             | No safe proven fix; all original assertions remain; see measured failures below                                                                                 | Unresolved; phase stopped after three approaches |

## Audits

### Accessibility

Completed widget audits retain every axe rule. Host frame traversal is outside the widget scope. Keyboard audits now run separately from the native walk, with identical feature state and control text/pressed/disabled/checked projections; the audit page retains initial Close focus. Focus geometry is tested on the primary keyboard page. This avoids claiming that an isolated scan reproduces every transient focus state.

Observed targets are at least 24 CSS pixels; computed text contrast has a minimum of 6.82045:1 and control boundaries 3.68764:1 in the new host/configuration evidence. The panel's focus rule is 3 px. These are fixture measurements, not a certification of arbitrary host pages. Refreshed headed walks pass in all five projects (54.7 seconds). Screenshots show a fully visible Reset all focus ring and independent UI typography; semantic snapshots contain the named dialog, three groups, control states and live status. [Receipts and provenance](assets/phase-7/README.md) are committed; the refreshed headed run passes all five projects in 54.7 seconds.

Semantic trees expose the named dialog, three labelled sections, native radio choices, pressed toggles and status. Potential speech confusions remain for the human: the long panel, focusable aria-disabled stepper limits, possible redundant label/group speech and coalesced rapid announcements. Touch-only cursor unavailability is explained visibly. Host-focus protection may intentionally hide the launcher; the shortcut remains available and the packed remount guard tests this state. Native owner modal/inert behavior remains an integration limit.

The WCAG table covers all 55 A/AA criteria. Screen-reader speech, physical devices, Windows forced-colours behaviour and real browser-menu zoom remain explicitly unverified. No screen reader has been run by this agent.

### Security and privacy

No new runtime dependency, request, cookie, analytics, storage key or unsafe DOM API was added. Source review finds only the existing guarded localStorage calls in the storage adapter. Public API options/instance shapes remain unchanged. The optional font URL never downloads a font; the owner must preload it.

All 21 existing dev dependencies retain their established purposes: TypeScript/tsup/Vite build and fixtures; ESLint/@eslint/js/typescript-eslint linting; Prettier formatting; Vitest/jsdom/coverage-v8 tests; Playwright/axe browser audits; size-limit/@size-limit/file budget; publint/attw package checks; Node/React type packages and React/ReactDOM integration tests. No unused dependency was added. The lock additions fulfil an existing rolldown WASI dependency, not a new runtime choice.

MIT licence text, 2026 author attribution and package metadata remain correct. .gitignore covers node_modules, dist, coverage, test-results and .env*. CI has read-only contents permission and no secret-echo step. The CSP guide documents the tested nonce and constructed-sheet paths and the unsupported blocked fallback without a nonce.

The dev tools remain used as follows (no direct dependency was added):

| Dev dependencies                                              | Purpose                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| typescript, tsup, vite                                        | Strict source/consumer types, library formats, local fixtures/examples |
| eslint, @eslint/js, typescript-eslint, prettier               | Flat-config linting and formatting gates                               |
| vitest, @vitest/coverage-v8, jsdom                            | Unit/lifecycle tests and enforced coverage                             |
| @playwright/test, @axe-core/playwright                        | Browser/device/media tests and axe audits                              |
| size-limit, @size-limit/file                                  | IIFE gzip gate                                                         |
| publint, @arethetypeswrong/cli                                | Consumer package and declaration checks                                |
| @types/node, @types/react, @types/react-dom, react, react-dom | Build/runtime typing and actual React client/SSR integration tests     |

### Performance and size

Latest local content timings pass the unchanged 100 ms limits (90 samples; maxima 18 ms synchronous / 55 ms next-frame callback). Those callbacks are not a laboratory measurement of final pixel paint. IIFE is 57,849 raw bytes / 19,603 gzip bytes, compared with Phase 6's 57,294 / 19,404: +555 raw / +199 gzip. No bundle or coverage output is committed. Raw source-map attribution is core 14,292, features 24,759, UI 18,043, public entry 140 and wrapper/unmapped 615 bytes; gzip parts are not additive. React stays external (384-byte ESM / 838-byte CJS), with no core/react source overlap and one module of each in the combined-consumer check.

The post-viewport stress run passes seven cases with three documented CDP skips (18.0 seconds): 200 lifecycles per project, 9,400 matched listener additions/removals per project, exact DOM/head/html restoration and identical adopted sheets. Maximum measured init is 4 ms. The current runtime/panel probe also passes 18 browser cases in 14.0 seconds: host boxes are unchanged, DOM restores exactly and Chromium reports CLS 0; Firefox/WebKit expose no layout-shift entries here, so their CLS is null rather than an invented zero. Every weakly referenced instance/host is collected, with constant 51 DOM nodes and 16 total environment listeners after GC. Total VM heap nevertheless rises by 26,892 bytes. The fitted 95% slope interval includes zero. This is not a zero-byte heap-growth claim; JIT/tooling allocations and non-CDP engines remain limits.

## Known limitations

**Blocking performance limit:** local M3 Pro samples pass, but the hosted macOS WebKit runner does not meet the next-frame gate. Synchronous work and requestAnimationFrame latency are different measurements; neither proves final pixel paint. Attribution of the remaining delay to browser layout, scheduler contention or widget work requires profiling on that runner. No unmeasured root cause is asserted.

The widget does not remediate arbitrary markup, closed shadow roots, cross-origin frame internals, canvas pixels, GIF/JS-driven animation or hostile geometry. Native owner modal/inert/top-layer interactions and body replacement can require owner integration/reinitialisation. There is no automatic remount into a replaced body. Font/colour/layout trade-offs remain documented in the ADRs.

## Deviations from the prompt (and why)

No public API shape deviation. Letter spacing now permits emergency wrapping in semantic text blocks while active. Safari-target WebKit/iPhone CI uses macOS: [Playwright documents platform codec differences and recommends macOS for Safari-like video testing](https://playwright.dev/docs/browsers#webkit). Failed Linux WPE media/timing results remain recorded; Linux WPE playback is not claimed to pass. Testing separates semantic/keyboard traversal from axe on a matching independent page after a reproducible Firefox process crash. No browser, axe rule, explicit performance threshold or coverage gate was removed. Pairwise coverage is binary default/maximum, not every intermediate Cartesian combination. The required complete CI pass is unmet. The completion tag is withheld because of R-17, not because human screen-reader testing is being represented as automated work. The browser connector was unavailable; headed Playwright supplied real-browser keyboard interaction and screenshots instead.

## Handoff notes for the next phase

Do not start Phase 8 as though Phase 7 passed. The next engineering task is a separately scoped WebKit performance investigation on the hosted macOS runner, retaining the 100 ms assertions and a guard for any proven fix. Local verify and functional browser passes are insufficient to declare that blocker fixed. The human must also run the screen-reader/device script and fill in its currently Not run results before making spoken-output/device claims. Publishing remains human-only.

## Phase commit list

Observed `git log --oneline phase-6-complete..HEAD` before this closing report commit; no completion tag was created.

```text
65363da docs(a11y): record scoped results and the performance blocker
db00552 docs(audit): preserve the unresolved WebKit timing evidence
262e16a docs(audit): preserve browser evidence with source provenance
396d478 docs(architecture): explain guarded placement and focus ownership
4532e80 docs(report): record Linux findings and guarded corrections
b7dcb2c fix(examples): use native tab navigation on each platform
5d37ac2 ci(webkit): test Safari media on the macOS port
bb0a60c fix(ui): balance focus clearance around tall controls
817fae0 fix(letter-spacing): wrap expanded tokens in text blocks
1a9829c fix(examples): check remounts through the keyboard shortcut
06949a6 docs(report): record guarded fixes and pending CI verification
8239037 fix(viewport): anchor RTL panels to the fixed root viewport
b67fb6f fix(ui): track focus within the shadow-root scrollport
912fe2f fix(audit): isolate axe from native keyboard traversal
f9c96b0 fix(ui): tolerate an absent body during placement refresh
8512ef2 fix(ui): avoid placement frames for state-only updates
f0be3b2 perf(ui): coalesce placement reads and cache author zoom
935196b perf(test): remove allocations from exhaustive flash analysis
6262faa fix(audit): bound Firefox multi-axe cases as slow tests
7fa9bed docs(csp): describe tested policies and stylesheet fallbacks
9f164c1 test(audit): record browser keyboard and semantic evidence
86b1384 fix(lockfile): restore missing optional dependency records
316e74e docs(a11y): establish the scoped WCAG evidence matrix
01ccde3 docs(a11y): add an honest human screen-reader test script
3199ec8 ci(matrix): run every browser profile on Node twenty and twenty-two
dae597a test(memory): check retained objects and post-GC heap trend
acc72c5 test(lifecycle): prove cleanup across two hundred mounts
0a0c4d3 test(keyboard): traverse and change all eighteen controls
c578ee5 test(combinations): cover every binary feature pair and single maximum
b6c0ce4 fix(audit): authorize detached CSP stylesheet copies
6500902 docs(report): record blocked phase seven audit
4500b46 docs(audit): preserve blocked CSP and partial matrix evidence
cf0184f test(hosts): capture maximum-feature QA coverage across profiles
7c6a688 test(csp): preserve the blocked nonce-fallback audit case
d2d5018 fix(fixtures): make opaque-frame checks self-contained
685ba0d test(fixtures): add isolated, heavy and hostile QA host pages
de1a0f1 test(matrix): add phone profiles and disable automatic retries
```
