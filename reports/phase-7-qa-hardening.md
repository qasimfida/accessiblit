# Phase 7 — QA hardening

Status: BLOCKED

Date: 2026-11-13. Range starts at `phase-6-complete` (`a47a551`); latest tested workflow/source is `a08cac3`. Closing documentation commits follow that source. No `phase-7-complete` tag exists.

## Summary

The resumed work adds a guarded native-CSS diagnostic and isolates performance probes from functional browser work. Existing pushed history is preserved; new test, CI and audit changes have separate conventional commits. I interpreted “process next” as continuing the Phase 7 blocker; a Phase 8 brief was requested because none has been supplied.

Local verify and both CI verification jobs pass. The complete latest browser matrix does **not** pass: 2,394 passed, four failed and 18 capability-dependent cases were skipped across Node 20/22. All functional cases pass. Node 22 WebKit fails four unchanged next-frame gates, with a maximum sample of 156 ms against `< 100 ms`. The entire Node 20 matrix passes. No failed job was manually rerun, no sample was discarded, and no quality threshold changed.

Three resumed approaches did not resolve R-17: grouped exclusions and typed CSS variables showed no repeatable local improvement; fresh-process CI isolation still fails. Tracing, settling and headed/headless comparisons also failed to establish a useful local improvement. Native CSS controls exceed 100 ms without the widget on the three-vCPU virtual M1. AGENTS.md sections 2.7 and 11 require preserving the gate and stopping after unsuccessful approaches. An existing macOS CI reference-runner label has been requested; the connected GitHub tool cannot list registered runners. That input remains pending.

Preflight: AGENTS.md was read completely; main was clean; `git pull --ff-only` returned already up to date at resumption (`85813f3`). The phase-six tag resolves to a47a551682109f4bcc016a62fd0ac4b353b59533. Constants have no YOUR_ placeholder. Current tools: Node 24.13.0, npm 11.6.2, git 2.50.1. Local hardware: Apple M3 Pro, 18 GiB. CI tests Node 20 and 22. The original stopped CSP report remains in 6500902 and its historical receipt is retained.

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
- e2e/performance-diagnostics.spec.ts compares native CSS and the engine on 5,000 paragraphs, checks actual values/restored baselines and records synchronous work, forced layout, frame time and public runner CPU metadata. Native controls are lower bounds with simpler selectors, not replacement gates.
- CI runs each desktop project's original seven timing tests in a fresh invocation, then all remaining tests even after a timing failure. The partition contains 21 timing and 1,187 remaining cases across the projects, with zero omissions or overlap. Phone projects retain their 100 QA cases each.
- New audit receipts preserve discarded prototypes and both resumed CI runs. No runtime source, public API, dependency version or package format changed during this resumption.

## Verification (commands run, real results)

| Command / run                               | Result                                                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| npm run verify                              | PASS: lint/format, typecheck, 179 tests in 57 files, coverage, all formats/types/maps, plain-Node SSR, size, publint and attw |
| Coverage, local and both CI Node versions   | Global 96.12% lines / 90.71% branches; core 98.63% lines / 97.96% branches                                                    |
| Original content plus new diagnostic checks | 54 passed in 19.9 seconds, all desktop engines                                                                                |
| Isolated timing invocation, local           | 21 passed in 9.8 seconds; every original value, node count and assertion retained                                             |
| Targeted remaining invocation, local        | 22 passed in 16.2 seconds, including strict CSP and native controls                                                           |
| Headed keyboard walk, local                 | Five projects passed in 54.8 seconds; all eighteen changes, reset, Escape/focus return and Tab exit                           |
| actionlint / exact partition                | PASS; 1,208 cases per Node version, no omissions or overlap                                                                   |
| npm audit / npm audit --omit=dev            | Both zero vulnerabilities; no runtime dependencies                                                                            |
| npm pack --dry-run --json                   | Exactly 17 intended files: LICENSE, README, package.json and fourteen dist artifacts; no tests or secrets                     |
| Latest full CI                              | FAIL: 2,394 passed, four failed, 18 skipped / 2,416 scheduled; eleven of twelve jobs pass                                     |

### Latest complete CI result

[CI a08cac3](https://github.com/qasimfida/accessiblit/actions/runs/43468481327) executes the entire matrix with zero retries. Both verification jobs pass clean npm ci, lint, types, 179 unit tests, build, size, SSR, package checks, audit and all fifteen packed integration checks. Raw rows, job ids and step outcomes are in [isolated-ci-verification.json](assets/phase-7/isolated-ci-verification.json).

| Project                    | Node 20                                                    | Node 22                                                                  |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Chromium / Linux           | 336 passed; timing 8.0 s, remaining 5.0 min                | 336 passed; timing 7.1 s, remaining 6.3 min                              |
| Firefox / Linux            | 332 passed, four skipped; timing 11.1 s, remaining 9.9 min | 332 passed, four skipped; timing 10.2 s, remaining 10.4 min              |
| WebKit / macOS             | 332 passed, four skipped; timing 10.1 s, remaining 6.3 min | 328 passed, four failed, four skipped; timing 24.8 s, remaining 10.1 min |
| iPhone emulation / WebKit  | 99 passed, one skipped, 5.0 min                            | 99 passed, one skipped, 5.8 min                                          |
| Pixel emulation / Chromium | 100 passed, 3.1 min                                        | 100 passed, 3.8 min                                                      |

All four failures are in Node 22 WebKit:

| Feature       | Maximum synchronous sample | Maximum next-frame sample |
| ------------- | -------------------------: | ------------------------: |
| lineHeight    |                      22 ms |                    118 ms |
| letterSpacing |                       7 ms |                    113 ms |
| wordSpacing   |                       9 ms |                    142 ms |
| fontSize      |                      55 ms |                    156 ms |

The font-size sample at exactly 100 ms fails too: the original assertion is strictly `< 100`. Every synchronous assertion passes. The failed timing step remains a job failure; its remaining 325 functional cases still pass with four documented capability skips. This proves the new failure-propagation path rather than hiding the failed budget.

Nine skips per Node version are unchanged API limitations: precise heap sampling in Firefox/WebKit/iPhone (three), legacy CDP pinch zoom in Firefox/WebKit (two), legacy CPU tracing in Firefox/WebKit (two), and legacy heap tracing in Firefox/WebKit (two). No required widget axe, host/profile or pairwise case is skipped. Phone projects run QA suites, not every desktop legacy case.

### Historical discovery and comparison runs

- The local f9c96b0 discovery run had 1,169 passes, 15 failures and nine skips in 17.4 minutes. It exposed R-9 through R-11. [discovery.json](assets/phase-7/discovery.json) is explicitly historical, as are its standard-profile screenshots.
- CI 06949a6 had 2,320 browser passes, 48 failures and 18 skips; its functional/media findings motivated R-12 through R-16. The original blocked CSP evidence remains historical.
- [CI 4532e80](https://github.com/qasimfida/accessiblit/actions/runs/43449963007) had 2,367 passes, seven timing failures and 18 skips. [ci-verification.json](assets/phase-7/ci-verification.json) preserves those samples, including the 159 ms next-frame result.
- [CI 77bbc4f](https://github.com/qasimfida/accessiblit/actions/runs/43467603736) added native controls and had 2,397 passes, one unchanged 101 ms word-spacing failure and 18 skips. [native-ci-comparison.json](assets/phase-7/native-ci-comparison.json) preserves its complete results. Warm native CSS samples reach 125 ms for font size and 110 ms for word spacing without the widget.
- [resumed-profiling.json](assets/phase-7/resumed-profiling.json) preserves the local prototypes and their discarded status. No small, inconsistent timing variation was treated as a proven runtime fix.

## Review findings and fixes

| Severity | Finding                                                                                                              | Fix                                                                                                                                                             | Status                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Medium   | R-1: external frame CSS caused an opaque-frame resource error                                                        | d2d5018: self-contained frame; qa-boundaries guard                                                                                                              | Fixed                                         |
| High     | R-2: axe copied nonce styles into detached documents without CSP authorisation                                       | b6c0ce4: authorise only audit-owned copies; strict nonce/CSP guards; no suppressed errors or rules                                                              | Fixed                                         |
| High     | R-3: existing main CI failed at npm ci because the lock omitted two required optional records                        | 86b1384: minimal lock repair; isolated red/green installation and existing CI npm-ci gate                                                                       | Fixed                                         |
| Medium   | R-4: a fully asserted Firefox audit exceeded the default wall timeout during contention                              | 6262faa: bounded slow annotation for multi-axe cases; original case passes in 6.5 seconds                                                                       | Fixed                                         |
| Medium   | R-5: exhaustive flash analysis allocated millions of temporary arrays and timed out                                  | 935196b: scalar squared distances, one square root; same exhaustive inputs and thresholds                                                                       | Fixed                                         |
| High     | R-6: placement forced host layout after every setting change, exceeding 100 ms                                       | f0be3b2: coalesced/cached geometry; unit and timing guards                                                                                                      | Fixed                                         |
| Medium   | R-7: placement queued an unnecessary third frame for two overlays                                                    | 8512ef2: observer-owned scheduling; exact two-frame and zero-off/destroy assertions retained                                                                    | Fixed                                         |
| Medium   | R-8: a temporary missing body threw during a new zoom-cache read                                                     | f9c96b0: null guard; public init/open red/green unit regression                                                                                                 | Fixed                                         |
| High     | R-9: Firefox crashed inside axe.runPartial when keyboard/semantic traversal and audit were interleaved               | 912fe2f: uninterrupted walk plus independent audit page; compare every saved state and actual control projection; five Firefox profiles pass                    | Fixed                                         |
| High     | R-10: document focus handling missed internal shadow transitions and a WebKit radio was partly clipped               | b67fb6f: shadow-root focus listener; scroll regression 0 to required 24 px; all 25 keyboard cases pass                                                          | Fixed                                         |
| High     | R-11: Pixel RTL overflow expanded innerWidth to 515 while the fixed viewport stayed 412, placing the panel at -67 px | 8239037: cached root client width; all four visual bounds; Pixel regressions now report left 36/right 396                                                       | Fixed                                         |
| High     | R-12: packed React remounts required immediate launcher visibility despite permitted host-focus protection           | 1a9829c: force overlap, assert hidden state, then prove mount uniqueness, shortcut access, Escape focus return and visibility; all 15 packed checks pass        | Fixed; both CI verification jobs pass         |
| High     | R-13: Linux font metrics overflowed a grid word at maximum spacing                                                   | 817fae0: scoped emergency wrapping while letter spacing is active; 90 spacing/combination checks pass, including a new three-engine red/green long-token guard  | Fixed                                         |
| High     | R-14: a tall enlarged-text control received only 4 px of focus clearance at one edge                                 | bb0a60c: balanced adaptive clearance; geometric regression and 19 viewport checks pass, with the original 6 px assertions                                       | Fixed                                         |
| High     | R-15: Linux WebKit media promises hang and its port misses timing limits                                             | 5d37ac2: run every WebKit/iPhone test on the Safari-target macOS port for both Node versions; Linux Chromium/Firefox/Pixel remain; no test or threshold removed | Media passes on macOS; timing remains R-17    |
| Low      | R-16: packed WebKit traversal assumed macOS Option+Tab on every OS                                                   | b7dcb2c: use ordinary Tab outside macOS; retain all focus assertions; packed checks pass locally                                                                | Fixed; both CI verification jobs pass         |
| Blocker  | R-17: WebKit next-frame timing exceeds 100 ms on 5,000 nodes                                                         | Native controls and discarded prototypes recorded in 77bbc4f, b865442, ed3e138 and b2eebb0; a08cac3 isolation still fails on Node 22                            | Unresolved; reference runner label requested  |
| Medium   | R-18: strict timing probes shared a browser process with earlier functional/GPU audits                               | a08cac3: fresh timing invocation; exact disjoint partition of all 1,208 cases; functional tests still run after failure and the job remains failed              | Process isolation fixed; R-17 remains blocked |

## Audits

### Accessibility

All required host/profile, individual maximum, binary pairwise, all-eighteen-on, keyboard, reset, CSP and boundary cases pass on all five projects and both Node versions. Executed widget axe scans report zero violations, with no suppressed rule. Keyboard traversal and matching-state audits use separate pages after the documented Firefox tooling crash; this does not claim every transient focus state was scanned.

Current computed minima are 24×24 CSS pixels, 6.82045:1 text contrast and 3.68764:1 control-boundary contrast. The focus indicator is 3 px. Five refreshed headed native-keyboard walks pass in 54.8 seconds. They change all eighteen settings, reset, close with Escape, return focus and tab out. Historical screenshots/semantic trees retain their source provenance; the resumption does not relabel them as newly captured. The runtime source is unchanged during this resumption.

The semantic tree exposes a named non-modal dialog, three labelled sections, native checked radios, pressed toggles and live status. Human speech checks remain necessary for the long panel, focusable aria-disabled stepper limits, possible repeated label/group speech and coalesced announcements. Host-focus protection may hide an overlapping launcher; the shortcut remains usable and packed remount tests guard it. Native owner modal/inert interactions remain a host limit.

[ACCESSIBILITY.md](../docs/ACCESSIBILITY.md) links all 55 A/AA criteria: 29 scoped passes, 21 not applicable and five not verified. No screen reader or physical phone was used. NVDA, VoiceOver and TalkBack results remain Not run in [the human script](../docs/manual-screen-reader-test.md). Windows forced colours, device rotation and browser-menu zoom remain human work. The browser connector was unavailable; headed Playwright supplied actual browser keyboard interaction.

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

The new CPU/platform records are test-only diagnostics. The packed allowlist excludes them and every test/fixture. Current audit commands both report zero vulnerabilities. No secrets, environment files or credentials were read. Existing checkout credential persistence remains disabled and CI permissions remain contents: read.

### Performance and size

The IIFE is 57,849 raw / 19,603 gzip bytes, compared with Phase 6's 57,294 / 19,404: +555 raw / +199 gzip. The warning remains 30,000 and limit 35,000 bytes. Source-map attribution is core 14,292, features 24,759, UI 18,043, public entry 140 and wrapper/unmapped 615 bytes. Gzip parts are not additive. React remains separate (384-byte ESM / 838-byte CJS); packed checks retain one core and one React module in the combined consumer.

The unchanged timing gates fail as reported above. Native controls also miss 100 ms: the baseline virtual-M1 run has a 125 ms warm native-font frame and 110 ms warm native-spacing frame. In the latest run, native word-spacing layout reaches 124 ms and its frame 134 ms on Node 22. Controls use simpler selectors and explicit layout reads, and their cold row includes fixture layout. They establish environment-dependent native cost, not zero library overhead or final-paint measurement. Node 20 passes while Node 22 fails on the same reported three-vCPU virtual-M1 model; the exact cause of every scheduling/rendering delay is not asserted.

Current CI stress checks perform 200 init/destroy cycles per project: 9,400 matched listener additions/removals each, zero listener residue, exact body/head/html restoration and identical adopted-sheet identities. Maximum stress init is 18 ms; the separate runtime probe reaches 29 ms, both under 50. Host boxes are unchanged and Chromium CLS is zero. Firefox/WebKit expose no layout-shift entries here and report null.

The four CDP heap checks (Chromium/Pixel × Node 20/22) collect all weakly referenced instances/hosts. DOM nodes remain 51 and environment listeners 16 at every checkpoint. VM heap nevertheless rises 26,952 bytes over the measured 200 cycles after 1,000 warmups; the lower 95% slope bound is -12.25883 bytes/cycle, so no positive trend is detected by this test. This is not a zero-byte-growth claim, nor a precise heap measurement in Firefox or WebKit.

## Known limitations (honest)

R-17 remains a blocker. Local M3 Pro samples pass, while hosted virtual-M1 samples and native controls can miss the strict next-frame gate. A defined macOS reference runner is needed before further performance work. The timing result depends on native layout, scheduling and capture work; no guarantee under arbitrary CPU load is established.

The widget does not remediate arbitrary markup, closed shadow roots, cross-origin frames, canvas, GIF/JS-driven animation or hostile geometry. Native owner modal/inert/top-layer behavior and body replacement can require owner integration/reinitialisation. There is no automatic remount into a replaced body. Font, colour and layout trade-offs remain in the ADRs. Physical devices and spoken output are unverified.

## Deviations from the prompt (and why)

The required complete CI pass is unmet and the completion tag is withheld. No public API shape, runtime dependency, runtime request, axe rule, coverage threshold or explicit timing limit changed. Safari-target CI uses macOS because of Playwright's documented platform codec differences; failed Linux WPE playback is not claimed to pass. [Playwright's WebKit guidance](https://playwright.dev/docs/browsers#webkit) explains that platform choice.

Fresh-process timing isolation is a CI measurement improvement, not a solution to R-17. All 1,208 cases per Node version remain covered exactly once. Grouped selectors, typed properties, reduced tracing, settled baselines and headed mode were not adopted as performance fixes. Pairwise coverage remains binary default/maximum, not every intermediate Cartesian combination. Pushed history was preserved under AGENTS.md section 10.

## Handoff notes for the next phase

Provide the label of an existing dedicated macOS CI performance-reference runner; do not relax the 100 ms assertions. The connected GitHub tool could not list registered runners. After a justified fix or confirmed reference environment, repeat the complete Node 20/22 matrix and closing protocol before tagging Phase 7. A Phase 8 brief has also been requested and is still missing. Human screen-reader/device checks remain pending. Publishing stays human-only.

## Phase commit list

Observed `git log --oneline phase-6-complete..HEAD` before this closing report commit; the final report commit follows this list. No completion tag was created.

```text
ee539e7 docs(a11y): distinguish functional passes from timing failures
6258d48 docs(audit): preserve the failed isolated timing gates
b2eebb0 docs(audit): record headed timing and keyboard comparisons
ed3e138 docs(audit): record native rendering costs on CI hardware
a08cac3 ci(perf): isolate timing probes from functional browser work
b865442 docs(audit): preserve resumed performance comparisons
77bbc4f test(perf): compare native reflow with engine timing
85813f3 docs(report): close phase seven with the WebKit blocker
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
