# Phase 7 — QA hardening

Status: PASS WITH NOTES

Date: 2026-11-14 (Asia/Karachi). Range: phase-6-complete (a47a551) to phase-7-complete. Final tested runtime/CI source: 5923f31; closing evidence and documentation commits follow it. The annotated completion tag is created after the final verify and push.

## Summary

The maintainer's Mac passes the unchanged synchronous-init median gate: Chromium **1.8999998569488525 ms**, p95 **2.700000047683716 ms**; WebKit **2 ms**, p95 **4 ms**. Each engine discards five warm-ups and measures thirty init calls. The user explicitly authorized keeping other apps open; the report records that condition honestly. AC power was attached. No runtime optimization was required or introduced during this resumption.

The full [Node 20/22 CI matrix](https://github.com/qasimfida/accessiblit/actions/runs/43521885088) passes all fourteen jobs, including both native-macOS regression guards. There are 2356 mandatory functional browser passes and 18 documented capability skips. All 42 historical absolute toggle probes still execute: 32 pass and 10 fail their unchanged assertions, reported separately under the maintainer's updated shared-runner policy. Those failures are not relabelled as timing passes. The phase verdict follows the newly defined reference init gate and mandatory functional/regression checks.

Preflight: AGENTS.md was read completely; main was clean and git pull --ff-only was up to date. Work used main with granular forward commits and no rewritten pushed history. Constants have no YOUR_ placeholder. Reference machine: Mac15,6, Apple M3 Pro, 18 GiB, 11 logical CPUs, macOS 26.5.2 build 25F84, Node 24.13.0. npm 11.6.2 and git 2.50.1; CI verifies Node 20 and 22.

## What changed (files and why)

- playwright.config.ts adds five browser/device projects and disables retries. QA fixtures cover plain HTML, an independent shadow component, iframes, strict CSP with constructed and nonce styles, 5,500 paragraphs, high-z-index modals and CSS resets.
- QA suites cover five media/direction profiles, all eighteen single maxima, all-eighteen-on, 32 binary pairwise rows, the full keyboard flow, 200 lifecycle loops and post-GC heap checks. Pairwise coverage checks all 153 feature pairs and their four default/maximum assignments.
- Runtime fixes earlier in the phase coalesce placement work, cache author zoom, handle an absent body, track shadow-root focus, preserve tall-control clearance, anchor mobile RTL placement to the fixed viewport and permit emergency text wrapping. Each finding has its own guarded commit below.
- scripts/perf.mjs and small helpers implement the specified real-IIFE benchmark. Four initial independent-clock/statistical tests guard run counts, the exact timer boundary and quantiles/regression boundary; two additional tests reject cross-runner/Node comparisons. All six run in verify and CI.
- reports/perf-macos.json stores the reference hardware, explicit open-apps exception, five warm-ups and thirty raw samples per engine. Separate committed CI baselines prevent comparing shared-runner trends with a different physical machine.
- CI reports absolute timings on shared runners and gates init median regressions greater than 50% against the committed matching runner baseline. Functional, axe, coverage, package, audit and size gates remain mandatory. Bootstrap capture was replaced by the guard; baselines are never automatically refreshed.
- ACCESSIBILITY.md, the human screen-reader script, CSP guide and performance reference distinguish measured evidence from human-only checks. No runtime source, lockfile, public API or dependency changed during this final performance resumption.

## Verification (commands run, real results)

| Command / evidence                    | Result                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run perf -- --other-apps-open     | PASS: Chromium median 1.8999998569488525 / p95 2.700000047683716 ms; WebKit median 2 / p95 4 ms; both <= 50 ms                                          |
| npm run verify                        | PASS: lint/format, typecheck, 184 Vitest tests in 58 files, six benchmark self-tests, coverage, formats/types/maps, plain-Node SSR, size, publint, attw |
| Coverage                              | Global 96.12% lines / 90.71% branches; core 98.63% lines / 97.96% branches                                                                              |
| Local unchanged content-toggle checks | 21 passed in 11.8 seconds; every original 5,000-node workload, value and strict 100 ms assertion retained                                               |
| Local runtime/lifecycle checks        | 20 passed in 14.3 seconds                                                                                                                               |
| Headed keyboard walk                  | Five projects passed in 49.6 seconds; every feature changed, reset, Escape/focus return and Tab exit                                                    |
| All-max target/contrast audit         | Five projects passed in 9.0 seconds; all executed axe scans zero violations                                                                             |
| Heap                                  | Two passed, three explicit CDP-capability skips in 15.9 seconds                                                                                         |
| npm audit / npm audit --omit=dev      | Both zero vulnerabilities; zero runtime dependencies                                                                                                    |
| npm pack --dry-run --json             | Exactly 17 intended files; no tests, scripts, reports or secrets                                                                                        |
| actionlint                            | PASS                                                                                                                                                    |
| Full CI                               | Fourteen jobs success; 2356 functional passes, 18 capability skips; historical timing outcomes reported separately                                      |

### CI init trend guard

| Node | Engine   | Baseline median | Observed median / p95                      | Guard limit | Result |
| ---- | -------- | --------------- | ------------------------------------------ | ----------- | ------ |
| 20   | Chromium | 1.5 ms          | 1.9000000000087311 / 3.7000000000116415 ms | 2.25 ms     | Pass   |
| 20   | WebKit   | 3 ms            | 3.5 / 7 ms                                 | 4.5 ms      | Pass   |
| 22   | Chromium | 1.75 ms         | 1.5 / 2 ms                                 | 2.625 ms    | Pass   |
| 22   | WebKit   | 5 ms            | 3 / 5 ms                                   | 7.5 ms      | Pass   |

CI uses macos-26, VirtualMac2,1 / virtual M1 / three logical CPUs / 7 GiB. Node-specific baseline files contain all samples and bootstrap job provenance. Exactly 50% growth passes; any greater growth fails. Wrong runner class or Node major fails validation. Bootstrap capture had no timing verdict. [Raw guard evidence](assets/phase-7/init-trend-verification.json) records the actual passing comparison.

### Full CI jobs and elapsed test results

| Job                     | Conclusion | Actual result lines                                                     |
| ----------------------- | ---------- | ----------------------------------------------------------------------- |
| verify (22)             | success    | 184 unit tests; 6 benchmark self-tests; 15 packed integrations pass     |
| browsers (22, firefox)  | success    | 7 passed (6.9s); 4 skipped; 325 passed (7.3m)                           |
| verify (20)             | success    | 184 unit tests; 6 benchmark self-tests; 15 packed integrations pass     |
| init trend (22)         | success    | CI relative init guard passes; raw data in init-trend-verification.json |
| browsers (20, chromium) | success    | 7 passed (4.9s); 329 passed (4.5m)                                      |
| init trend (20)         | success    | CI relative init guard passes; raw data in init-trend-verification.json |
| browsers (22, chromium) | success    | 7 passed (4.5s); 329 passed (4.6m)                                      |
| browsers (20, iphone)   | success    | 1 skipped; 99 passed (6.0m)                                             |
| browsers (20, firefox)  | success    | 7 passed (10.7s); 4 skipped; 325 passed (10.7m)                         |
| browsers (22, pixel)    | success    | 100 passed (3.9m)                                                       |
| browsers (22, webkit)   | success    | 7 failed; 4 skipped; 325 passed (12.2m)                                 |
| browsers (20, webkit)   | success    | 3 failed; 4 passed (27.4s); 4 skipped; 325 passed (11.2m)               |
| browsers (20, pixel)    | success    | 100 passed (4.0m)                                                       |
| browsers (22, iphone)   | success    | 1 skipped; 99 passed (5.5m)                                             |

All 1,208 cases per Node version remain in the disjoint timing/functional partition with no omissions, overlap or retries. Nine capability skips per Node are precise CDP heap on Firefox/WebKit/iPhone (three), and legacy CDP pinch zoom, CPU tracing and heap tracing on Firefox/WebKit (six). No required axe, host/profile, pairwise or keyboard case is skipped. All fifteen packed integrations pass on both Node versions. Raw rows, timings, steps and provenance are in [reference-ci-matrix.json](assets/phase-7/reference-ci-matrix.json).

## Review findings and fixes

| Severity | Finding                                                                                                              | Fix                                                                                                                                                                                 | Status                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Medium   | R-1: external frame CSS caused an opaque-frame resource error                                                        | d2d5018: self-contained frame; qa-boundaries guard                                                                                                                                  | Fixed                                                                         |
| High     | R-2: axe copied nonce styles into detached documents without CSP authorisation                                       | b6c0ce4: authorise only audit-owned copies; strict nonce/CSP guards; no suppressed errors or rules                                                                                  | Fixed                                                                         |
| High     | R-3: existing main CI failed at npm ci because the lock omitted two required optional records                        | 86b1384: minimal lock repair; isolated red/green installation and existing CI npm-ci gate                                                                                           | Fixed                                                                         |
| Medium   | R-4: a fully asserted Firefox audit exceeded the default wall timeout during contention                              | 6262faa: bounded slow annotation for multi-axe cases; original case passes in 6.5 seconds                                                                                           | Fixed                                                                         |
| Medium   | R-5: exhaustive flash analysis allocated millions of temporary arrays and timed out                                  | 935196b: scalar squared distances, one square root; same exhaustive inputs and thresholds                                                                                           | Fixed                                                                         |
| High     | R-6: placement forced host layout after every setting change, exceeding 100 ms                                       | f0be3b2: coalesced/cached geometry; unit and timing guards                                                                                                                          | Fixed                                                                         |
| Medium   | R-7: placement queued an unnecessary third frame for two overlays                                                    | 8512ef2: observer-owned scheduling; exact two-frame and zero-off/destroy assertions retained                                                                                        | Fixed                                                                         |
| Medium   | R-8: a temporary missing body threw during a new zoom-cache read                                                     | f9c96b0: null guard; public init/open red/green unit regression                                                                                                                     | Fixed                                                                         |
| High     | R-9: Firefox crashed inside axe.runPartial when keyboard/semantic traversal and audit were interleaved               | 912fe2f: uninterrupted walk plus independent audit page; compare every saved state and actual control projection; five Firefox profiles pass                                        | Fixed                                                                         |
| High     | R-10: document focus handling missed internal shadow transitions and a WebKit radio was partly clipped               | b67fb6f: shadow-root focus listener; scroll regression 0 to required 24 px; all 25 keyboard cases pass                                                                              | Fixed                                                                         |
| High     | R-11: Pixel RTL overflow expanded innerWidth to 515 while the fixed viewport stayed 412, placing the panel at -67 px | 8239037: cached root client width; all four visual bounds; Pixel regressions now report left 36/right 396                                                                           | Fixed                                                                         |
| High     | R-12: packed React remounts required immediate launcher visibility despite permitted host-focus protection           | 1a9829c: force overlap, assert hidden state, then prove mount uniqueness, shortcut access, Escape focus return and visibility; all 15 packed checks pass                            | Fixed; both CI verification jobs pass                                         |
| High     | R-13: Linux font metrics overflowed a grid word at maximum spacing                                                   | 817fae0: scoped emergency wrapping while letter spacing is active; 90 spacing/combination checks pass, including a new three-engine red/green long-token guard                      | Fixed                                                                         |
| High     | R-14: a tall enlarged-text control received only 4 px of focus clearance at one edge                                 | bb0a60c: balanced adaptive clearance; geometric regression and 19 viewport checks pass, with the original 6 px assertions                                                           | Fixed                                                                         |
| High     | R-15: Linux WebKit media promises hang and its port misses timing limits                                             | 5d37ac2: run every WebKit/iPhone test on the Safari-target macOS port for both Node versions; Linux Chromium/Firefox/Pixel remain; no test or threshold removed                     | Media fixed; later reference contract applies                                 |
| Low      | R-16: packed WebKit traversal assumed macOS Option+Tab on every OS                                                   | b7dcb2c: use ordinary Tab outside macOS; retain all focus assertions; packed checks pass locally                                                                                    | Fixed; both CI verification jobs pass                                         |
| Blocker  | R-17: WebKit next-frame timing exceeds 100 ms on 5,000 nodes                                                         | 61c1339/99d8632 define and implement the maintainer Mac median gate; 7d8d5ec records passing raw samples; 50be6fa enforces the CI trend guard; earlier failures retained            | Closed under the maintainer-defined init method; historical failure preserved |
| Medium   | R-18: strict timing probes shared a browser process with earlier functional/GPU audits                               | a08cac3: fresh timing invocation; exact disjoint partition of all 1,208 cases; functional tests still run after failure; the original a08cac3 job fails under its historical policy | Process isolation fixed; historical R-17 retained                             |
| Medium   | R-19: benchmark reference used a moving OS alias                                                                     | c4b448b tried standard Intel; ec4fa39 restores Apple Silicon with explicit macos-26 after measured regression                                                                       | Reference documented; historical R-17 retained                                |
| Medium   | R-20: visual trace observers contaminate strict timing probes                                                        | f640f31 disables screenshots/snapshots only for timing/control files; API/source traces and every assertion retained; 33-archive audit                                              | Fixed                                                                         |
| Medium   | R-21: cold fixture/prior-render work shares a transition interval                                                    | 5f55325 settles host baselines before each stopwatch; five independent-clock/workload guards retain API and callback costs                                                          | Instrumentation fixed; historical R-17 retained                               |
| Medium   | R-22: forced-layout controls incorrectly described as numeric lower bounds                                           | 1604aae qualifies metric differences in diagnostic comments and docs; raw receipts unchanged                                                                                        | Fixed                                                                         |
| High     | R-23: Intel trial regresses all seven timing cases and full-suite completion                                         | ec4fa39 rolls back to original Apple Silicon platform; native functional suite passes both Node versions                                                                            | Regression fixed; historical timing failure retained                          |
| Medium   | R-24: legacy init assertions still applied absolute maxima to shared CI                                              | 3984401 scopes only those duration assertions to local runs; all cleanup, CLS, network and listener assertions remain mandatory; 20 local cases and full CI pass                    | Fixed                                                                         |

## Audits

### Accessibility

Executed widget axe scans report zero violations across the mandatory host/profile, maxima, pairwise, all-eighteen-on, keyboard, reset, CSP and boundary checks. Semantic traversal and matching-state axe use independent pages after the documented Firefox tooling crash; this does not claim every transient focus state was scanned.

Fresh all-max computed minima: targets 24×24 CSS px, text 6.820449946885106:1, control boundaries 3.68763813291651:1; the 3 px focus ring measures 7.32096843010406:1. Panel scroll width never exceeds client width in these checks. Host boxes remain unchanged and Chromium CLS is zero; Firefox/WebKit expose no layout-shift entries here and report null.

The fresh headed keyboard walk used native events in Chromium, Firefox, WebKit, iPhone emulation and Pixel emulation: Alt+A opens, focus starts at Close, Tab reaches each control in order, native Space/Enter/radio arrows change all eighteen values, Reset all restores defaults and announces, Escape returns focus to the launcher, reopening and tabbing leaves the non-modal panel. No trap was observed. There is no separate browser connector; headed Playwright supplied the actual browser interaction.

The semantic tree has a named non-modal dialog, three labelled sections, pressed toggles, checked native radios, visible labels/descriptions and live status. Human speech checks remain for possible repeated group/label announcements, coalesced messages and aria-disabled stepper limits. Host-focus protection may hide an overlapping launcher while keeping its shortcut available. Owner native-modal/inert interactions remain a documented integration limit.

The WCAG table covers all 55 A/AA criteria: 29 scoped passes, 21 not applicable and five not verified. No screen reader or physical phone was used. NVDA, VoiceOver and TalkBack remain Not run in docs/manual-screen-reader-test.md. Real Windows forced colors, physical device rotation and browser-menu zoom remain human work. Local evidence: [reference-session-audit.json](assets/phase-7/reference-session-audit.json). Historical screenshots retain their capture/source manifest; they are not relabelled as fresh images.

### Security and privacy

No new runtime request, dependency, cookie, analytics, storage key or unsafe DOM API. Source review finds only the guarded configured localStorage adapter. The optional font URL never downloads a font; the owner must preload it. Public API options/instance types still match AGENTS.md section 5. CI permissions remain contents: read; checkout does not persist credentials and no step echoes secrets. No credentials or environment files were read.

All 21 dev dependencies remain used: TypeScript/tsup/Vite for source and consumers; ESLint/@eslint/js/typescript-eslint/Prettier for lint/format; Vitest/coverage-v8/jsdom for tests; Playwright/axe for browsers; size-limit/@size-limit/file for gzip; publint/attw for package/types; Node/React type packages and React/ReactDOM for separate-entry integration tests. No new dependency was added. Earlier lock repair restores required optional WASI records only. MIT text, 2026 attribution and package metadata are correct. Ignore rules cover node_modules, dist, coverage, test-results and .env*. Packed output excludes tests/reports/helpers.

CSP evidence covers constructed sheets and nonce fallback, including strict styles and audit-owned detached copies. Site owners should follow docs/guides/csp.md, supply a nonce for a blocked style-element fallback and test their own policy. A blocked fallback without a nonce is an explicit unsupported path, not a hidden pass. External iframes and owner fonts remain outside widget control.

### Performance and size

The reference result measures synchronous init only; it is not a final-pixel paint guarantee. No runtime optimization was needed. Earlier virtual-M1 frame-callback failures remain in their raw receipts; native forced-layout controls are not strict numeric lower bounds on that different metric. The Intel trial failed and was rolled back, not counted as a fix.

IIFE: 57,849 raw / 19,603 gzip bytes, versus Phase 6 57,294 / 19,404 (+555 raw / +199 gzip). Limits remain 30,000 warning / 35,000 failure. Raw source-map attribution: core 14,292, features 24,759, UI 18,043, entry 140, wrapper 615 bytes; gzip parts are not additive. React stays separate at 384-byte ESM / 838-byte CJS. Packed checks prove one core/one React module and an empty unused import.

Every project's 200-cycle lifecycle check matches 9,400 listener additions/removals with zero residue and exact DOM/head/html/adopted-sheet restoration. Fresh local CDP tests warm up 1,000 cycles, then measure 200. Weak references are all collected, nodes remain 51 and environment listeners 16 at six checkpoints. VM heap rises 26,892 bytes; the lower 95% slope bound is -12.1296 bytes/cycle. No statistically detectable positive trend is found; this is not zero-byte growth or a precise Firefox/WebKit heap measurement.

## Known limitations (honest)

Spoken screen-reader output and physical devices are not verified. The tests cover binary default/maximum pairs, not every intermediate Cartesian combination. Emulation is not hardware testing. Timing depends on host work, engine scheduling and load; no absolute shared-runner or arbitrary-host paint guarantee is claimed.

The widget does not remediate arbitrary markup, closed shadow roots, cross-origin frames, canvas, GIF/JS-driven animation or hostile geometry. Body replacement may require owner reinitialisation. Owner modal/inert/top-layer integration and font/colour/layout trade-offs remain documented in the ADRs and guides. It does not make a host site WCAG conformant.

## Deviations from the prompt (and why)

The maintainer updated the benchmark contract in AGENTS.md section 8: the authoritative absolute gate is this Mac's synchronous init median <= 50 ms; shared CI reports absolute values and enforces a 50% relative guard. Historical 100 ms frame-callback assertions are unchanged and their CI failures are preserved as report-only diagnostics. No threshold, sample count, axe rule, coverage limit, functional assertion or size budget was relaxed. Local legacy timing assertions still pass.

The maintainer explicitly instructed running without closing other apps, overriding only the section 8 apps condition; reports/perf-macos.json records otherAppsClosed=false and the exception. AC power remained required. Safari-target functional/media CI stays on native macOS; Linux WebKit playback is not claimed to pass. Every feature/public API remains unchanged. Pushed history was preserved with granular forward commits.

## Handoff notes for the next phase

Proceed to the supplied Phase 8 Vite demo/docs brief after confirming main clean, pulling --ff-only and checking phase-7-complete. Human screen-reader/device checks remain pending. Do not auto-refresh CI baselines after a regression: investigate and review source, machine and samples. Publishing remains human-only; no npm publication occurred.

## Phase commit list

Observed git log --oneline phase-6-complete..HEAD before the closing report commit; that report commit and annotated tag follow this list.

```text
16f46b7 docs(a11y): reconcile conformance evidence with the defined init gate
f0c697c docs(audit): preserve the complete passing reference CI matrix
f57e4d0 docs(audit): preserve passing native CI regression samples
9c2376e docs(audit): preserve the reference-session accessibility and leak checks
5923f31 docs(perf): explain measured medians and the native CI guard
50be6fa ci(perf): enforce the committed fifty-percent regression guard
024db09 docs(perf): commit native CI trend baselines with raw samples
3984401 fix(perf-tests): scope absolute init checks to local runs
da4f8da ci(perf): capture native runner trends for the committed baseline
7d8d5ec docs(perf): record the passing Mac init baseline and raw samples
2ba2396 test(perf): record the authorized open-apps run condition
be4850a docs(report): record the init benchmark and AC-power prerequisite
875ac46 docs(perf): document the Mac reference benchmark protocol
99d8632 test(perf): measure reference init medians and raw samples
61c1339 docs(perf): define the maintainer Mac init-time reference
2b8d487 docs(report): close the corrected timing investigation as blocked
6ba3d8c docs(a11y): refresh the complete matrix and keyboard evidence
53ddf31 docs(audit): preserve the corrected WebKit timing failures
72e52c5 docs(perf): record the restored reference and failed gate
ec4fa39 fix(ci): restore Apple Silicon after the Intel regression
1604aae fix(audit): qualify native timing comparisons
5f55325 fix(perf-tests): settle host baselines before timed changes
c0d07bb docs(perf): document renderer-only timing instrumentation
f640f31 fix(perf-tests): exclude visual tracing from timing probes
af81eb8 docs(perf): define the pinned benchmark reference
c4b448b fix(ci): pin the WebKit benchmark reference hardware
0b8a067 docs(report): record the resumed performance blocker
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
