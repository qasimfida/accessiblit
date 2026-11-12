# Phase 3 — Content features

Status: PASS WITH NOTES

Date: 2026-11-13. Range: phase-2-complete (abf81c2) to phase-3-complete. The completion tag identifies this report's final commit.

## Summary

Seven production content features now register through the existing metadata-driven panel. No UI implementation changed. Effects compose, persist and restore without page-element inline styles. All requested feature levels passed on all seven fixtures in Chromium, Firefox and WebKit. Maximum combinations, exact DOM restoration, computed-style restoration, first-frame persistence and a 5,000-node performance budget passed.

Preflight read AGENTS.md completely, confirmed main, clean status, an already-up-to-date git pull --ff-only, and the local/remote annotated phase-2-complete tag. Constants contain no placeholders. Environment: Node 24.13.0, npm 11.6.2, git 2.50.1; Chromium 158.0.8127.18, Firefox 159, WebKit 27.2 on this Mac. Node 20/22 were not run locally; the existing CI matrix covers them.

## What changed (files and why)

- src/features/: one module per content feature, plus scoped selectors, reversible classification markers, cleanup ownership and observer reconciliation helpers. All new source modules are under 120 lines.
- src/core/sheet.ts and styles.ts: detach empty page sheets on reset, permit later recreation, and restore original html class/style serialization.
- src/core/lifecycle.ts and src/index.ts: resolve an owner-option-aware catalogue per instance without changing public exports.
- fixtures/: article, legacy px, rem/em, flex/grid, table, form and fixed/sticky-header hosts with shared styles and public-entry bootstrap.
- tests/features/, tests/core/ and e2e/: computed values at every level; dynamic owner changes; feature combinations; cleanup; owner-font privacy; early persistence; keyboard, semantics and timing.
- docs/adr/0001-font-scaling.md: compared root rem scaling with measured text baselines. Root scaling left the legacy px sizes unchanged; measured scaling doubled them correctly without nested em multiplication.
- docs/adr/0002-content-scaling.md: compared zoom with transform. At 200%, zoom kept the fixed header at viewport top after scrolling; transform displaced it by -600px. Zoom also preserved sticky positioning in all three engines.
- docs/adr/0003-owner-font-preloading.md and docs/architecture.md: scope, composition, CSP, font ownership and integration limits.
- reports/assets/phase-3/: 21 maximum-setting screenshots and raw measurements.json. Evidence commit: 7572442.

## Verification (commands run, real results)

| Command / probe                                               | Observed result                                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| npm run verify                                                | Passed lint, formatting, typecheck, 135 unit tests in 33 files, coverage, build, plain-Node SSR and size |
| Unit coverage                                                 | All source: 98.33% lines, 94.79% branches; core: 98.86% lines, 97.83% branches                           |
| npx playwright test --workers=1                               | 337 passed, 2 skipped, 3.0 minutes                                                                       |
| npx playwright test e2e/content-lifecycle.spec.ts --workers=1 | 3 additional production lifecycle checks passed after the full run                                       |
| Headed content-audit.spec.ts                                  | 6 passed across Chromium, Firefox and WebKit                                                             |
| Maximum combination integration                               | 24 passed: all seven fixtures in three engines, plus closed/open axe checks                              |
| First rendered probe frame after reload                       | 3 engines passed; all five sampled frames had 32px text, 64px line height and 1.5 root zoom              |
| npm run check:package                                         | publint and Are the Types Wrong passed                                                                   |
| npm audit and npm audit --omit=dev                            | Both reported 0 vulnerabilities                                                                          |
| git diff --check                                              | Passed                                                                                                   |

The two skips are the existing Chromium/CDP-specific mobile zoom and layout-shift supplemental paths on Firefox/WebKit. No requested feature-level test, browser, axe rule, budget or coverage gate was skipped or weakened. Browser performance checks used one worker to avoid competing benchmark pages.

Build outputs: ESM 39,755 bytes, CJS 40,229, IIFE 40,254, and each declaration entry 3,786 bytes; sourcemaps also emitted. Plain Node imported dist/index.mjs and CJS with browser-global access guarded, then exercised the inert SSR lifecycle.

The combined fixture checks compare exact serialized markup after reset and destroy. A separate form test compares computed font size/family, line height, letter/word spacing, alignment and zoom before/after. The prototype and feature tests check fixed/sticky behavior and author zoom composition.

## Review findings and fixes

Self-review covered AGENTS.md sections 2, 7 and 9. No remaining Blocker, High or Medium finding was identified.

| Severity | Finding                                                                                                   | Fix                                                                                                                   | Status                      |
| -------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Medium   | R-1: alignment could inherit into custom ARIA controls and fallback role tokens                           | cc1bd85 protects checkbox/radio/searchbox and other controls, and matches role tokens; regression tests               | Fixed                       |
| Medium   | R-2: owner scripts could change an element's role after initial classification                            | f03fc6a observes role changes and reclassifies affected alignment; regression test                                    | Fixed                       |
| Low      | Screenshot caret hiding left empty style attributes on form controls, creating false restoration failures | fa6d621 captures with caret initial; exact assertions retained                                                        | Test-tool artifact resolved |
| Low      | Native tab navigation may leave for browser chrome without a document focusin event                       | 7314730 records leaving the widget, closes with Escape, then independently verifies reopening and Escape focus return | Audit procedure corrected   |

Earlier implementation refinements include 933e322 for exact reset restoration and 1049fc6 for dependency reconciliation without observer loops. These have focused tests and separate commits.

## Audits

### Accessibility (evidence)

All seven maximum effects were tested together on every fixture and engine. Scroll/client dimensions found no clipped text blocks. Screenshots were saved for all 21 combinations; visual inspection covered a representative rendering of each of the seven fixture types. Article, nested em, flex/grid cards, table cells, form labels/controls and fixed/sticky content remained readable without observed text overlap. This does not establish universal host-page conformance.

The maximum-state axe checks reported zero widget violations closed and open in all three engines. The complete pre-existing media/320px/reduced-motion/forced-colors suite also passed in this session. Production geometry checks independently proved the panel remained 360px wide with a 20px heading, 26px line height and unchanged family/spacing after all seven effects.

The headed browser walk used Alt+A, native Tab (Option+Tab on macOS WebKit), progressed through the seven generated control groups and Reset, left the widget without a trap, and checked Escape focus return after reopening. Minimum actual radio input target: 24×24px; launcher: 48×48px; buttons: at least 44px high. Measured production light-theme text contrast minimum: 7.5558:1, active boundary contrast 4.0852:1, and 3px focus outline contrast 7.3210:1. The disabled Content scale decrease boundary was 3.6876:1.

| WCAG / behavior touched                            | Result                     | Evidence                                                                                   |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 2.1.1, 2.1.2, 2.1.4, 2.4.3                         | Pass                       | Headed modifier shortcut, logical native control tab order, exit without trap              |
| 2.4.7, 2.4.11                                      | Pass in tested layouts     | Focus evidence and existing host-focus collision tests pass; outside focus closes panel    |
| 2.5.3, 2.5.7, 2.5.8                                | Pass                       | Visible control labels; no dragging; measured targets at least 24×24                       |
| 1.1.1, 1.3.1, 1.4.1                                | Pass                       | Named groups/headings, hidden launcher icon, native checked state and visible values       |
| 1.4.3, 1.4.11                                      | Pass                       | Measured contrast above; full light/dark/forced-colors suite passed                        |
| 1.4.4, 1.4.10                                      | Pass in tested paths       | 320px and existing supplemental zoom tests pass; UI isolated from page zoom and typography |
| 1.4.12                                             | Pass in fixtures           | Line height up to 2, paragraph gap 2em, letters 0.2em, words 0.32em; no detected clipping  |
| 1.4.13                                             | n/a                        | No tooltips                                                                                |
| 4.1.2, 4.1.3                                       | Pass in automated evidence | Named dialog/control semantic trees, native radio groups, live-region tests                |
| Reduced motion, colour scheme, forced colours, RTL | Pass in existing tests     | Full browser suite rerun without UI changes                                                |

Semantic snapshots expose all seven labels, descriptions, native checked states and range buttons. Repeated “Off” names are contextualized by named radiogroups. Empty Colour/Navigation groups explicitly explain that options are unavailable. Screen-reader speech, repeated radio label verbosity, em-unit pronunciation and platform-specific announcements still need a human NVDA/VoiceOver check. No screen reader was run.

No browser-tool connector is available in this session; the real-browser walk used headed Playwright and captured semantic/measurement evidence. Firefox's known axe-plus-semantic-tool crash is avoided by separate audit pages, preserving all axe rules. No layout shift was caused by production init: host rectangles were identical across ten cycles, and Chromium CLS measured 0. Firefox/WebKit expose no layout-shift entries here and are reported as unmeasured.

### Security and privacy

No runtime dependencies or dependency changes. Existing dev dependencies remain justified by the unchanged build/test/lint/package tooling; the lockfile is unchanged. Both npm audits were clean. Source searches found no network APIs, FontFace creation/loading, unsafe DOM APIs or extra storage in feature modules. No secrets, generated build output, credentials or environment files were added.

The owner explicitly chose preloaded fonts. The widget uses the fixed AccessiblitDyslexia alias only when every registered variant is already loaded, otherwise a system fallback. Browser tests prove an unprepared bold variant remains unloaded and the configured URL receives no request. No @font-face or URL rule is injected.

CSP still uses constructed sheets where supported or the owner nonce on fallback style elements; full strict-CSP browser tests passed. All page rules share one document sheet and use html classes/variables plus reversible data markers. Only the existing configured localStorage key persists settings. Private markers and observers are released on reset/destroy.

### Performance and size (numbers)

Maximum measured milliseconds on 5,000 text-bearing elements, synchronous / through next animation frame, from the full browser run:

| Feature       | Chromium    | Firefox | WebKit  |
| ------------- | ----------- | ------- | ------- |
| fontSize      | 42.8 / 47.8 | 39 / 43 | 66 / 95 |
| lineHeight    | 24.8 / 29.3 | 17 / 17 | 43 / 53 |
| letterSpacing | 27 / 30.5   | 21 / 21 | 67 / 80 |
| wordSpacing   | 26.3 / 29.8 | 16 / 16 | 74 / 75 |
| textAlign     | 33.7 / 38.2 | 38 / 39 | 57 / 59 |
| contentScale  | 22.9 / 28   | 21 / 21 | 36 / 46 |
| readableFont  | 35.5 / 38.8 | 41 / 42 | 61 / 63 |

Each feature was toggled independently on the large fixture; this is not a claim that enabling seven effects sequentially completes in 100ms. Ten default production init cycles peaked at 1.5ms Chromium, 2ms Firefox and 2ms WebKit, below 50ms on this machine. Timings are environment-dependent; WebKit's 95ms frame sample has limited headroom.

IIFE gzip: **14,087 bytes**, versus Phase 2 **11,024 bytes**: **+3,063 bytes**. Below the 30,000-byte warning and 35,000-byte hard budget. Raw evidence is in assets/phase-3/measurements.json.

## Known limitations (honest)

- Inline important styles, sufficiently stronger author selectors and fixed-size/overflow-hidden containers can resist adjustments or clip text. The widget does not repair arbitrary layouts.
- Shadow trees, iframes, SVG/MathML, generated text and canvas are outside the HTML text classifier. Code and semantic graphics deliberately keep their font families.
- Whole-layout zoom can create horizontal scrolling and change coordinate calculations. Owner fixed/sticky offsets and reserved space remain the owner's responsibility.
- Owner styles should load before early init. Stylesheet-load, class/style/visibility/role changes and resize are observed; arbitrary CSSOM insertRule edits or application-specific layout changes without those events may require reinitialization.
- Font faces must be preloaded by the owner under the documented alias, including every weight/style variant. Later owner font registration changes remain the owner's responsibility. The fallback makes no claim of universal dyslexia benefit.
- First-frame restoration is demonstrated with a blocking head script after owner styles. A widget loaded after first paint cannot undo an earlier flash.
- No human screen-reader speech check, physical mobile-device check or desktop toolbar zoom session was performed in this phase.

## Deviations from the prompt (and why)

The prompt's font URL behavior conflicted with AGENTS.md section 2's no-runtime-network rule. The human explicitly selected owner preloading; the URL is never fetched, as documented in ADR 0003. This follows the repository hard rule and the user's clarification.

The public API still matches section 5; no exports, option types or instance methods changed. The internal lifecycle accepts a per-init catalogue factory. No UI edits were needed. Content scale uses 10-point steps, matching the established core schema. Nonzero line height also sets paragraph gaps to meet the full text-spacing criterion.

## Handoff notes for the next phase

Add colour/navigation feature modules through the registry; preserve the scoped page stylesheet, ownership and metadata interface. In particular, future filters must target body content excluding the host, never html/body indiscriminately: Firefox top-layer UI is not isolated from root filters. Preserve exact restoration and the owner-font no-network contract.

Human next: check VoiceOver/NVDA announcements and a real host with restrictive CSS; preload any custom face before initialization. Review CI Node 20/22 results after push. Publishing remains human-only.

## Phase commit list

Implementation, tests, documentation and audit evidence before the report commit (newest first):

```text
7572442 docs(audit): record maximum content screenshots and measurements
378c667 test(lifecycle): measure production init and panel isolation
e6a7d66 docs(architecture): describe content effects and preload limits
7314730 test(accessibility): walk production controls and inspect semantics
30645e0 test(performance): time content toggles on 5000 nodes
1365022 test(persistence): verify adjusted first frames on reload
fa6d621 test(content): combine maximum settings and prove exact restoration
f03fc6a fix(content): reconcile owner role changes
cc1bd85 fix(text-align): protect custom controls and fallback roles
b688242 test(font-privacy): prove unloaded variants cannot trigger requests
ae74aa2 docs(adr): define the owner-preloaded font contract
7422077 feat(readable-font): use system stacks and owner-loaded faces
72e3b5a feat(text-align): align safe text blocks without layout inheritance
98344ec feat(content-scale): zoom layouts while preserving owner scale
041cdab feat(word-spacing): add reversible proportional text spacing
754e7b2 feat(letter-spacing): add reversible proportional text spacing
92cd2df feat(line-height): add reversible proportional text spacing
4261b98 feat(font-size): scale measured HTML text from 80 to 200 percent
1049fc6 refactor(content): reconcile logical feature dependencies once
ab2bbd3 feat(lifecycle): resolve feature catalogues from owner options
29af708 feat(content): reconcile owner changes without observer loops
15c737b feat(content): own reversible element classification markers
4194f9f feat(content): define scoped selectors and text classification
0b616cd docs(adr): choose CSS zoom to preserve fixed and sticky anchors
835de4c docs(adr): choose measured font baselines for px and rem text
3cce5ef test(prototypes): compare font sizing and layout scaling strategies
507da27 test(fixtures): add the fixed-header content page
dc7010e test(fixtures): add the form content page
0dc1197 test(fixtures): add the table content page
06306e7 test(fixtures): add the flex content page
ff84224 test(fixtures): add the rem content page
5d8b1f4 test(fixtures): add the legacy-px content page
c6aa2a0 test(fixtures): add the article content page
2ea9fdb test(fixtures): bootstrap the public API on content pages
a4ab383 test(fixtures): add shared content host styles
933e322 feat(styles): restore page attributes and sheets on reset
849b399 feat(sheet): allow empty owned sheets to detach and reopen
```
