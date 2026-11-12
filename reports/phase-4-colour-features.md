# Phase 4 — Colour features

Status: PASS WITH NOTES

Date: 2026-11-13. Range: phase-3-complete (e8ed6bd) to phase-4-complete. The completion tag identifies the final report commit.

## Summary

Four independent colour features register through the existing metadata-driven UI. Dark mode and high contrast use forced HTML palettes; saturation changes paint properties and atomic media without filtering layout ancestors. High contrast wins over dark mode, and monochrome wins over low saturation. All 16 combinations are supported with deterministic results.

Preflight read AGENTS.md completely, including continuous granular commit rules. main was clean; git pull --ff-only reported already up to date; the annotated phase-3-complete tag existed at e8ed6bd. It is unsigned, not missing. Environment: Node 24.13.0, npm 11.6.2, git 2.50.1; Chromium 158.0.8127.18, Firefox 159 and WebKit 27.2. Node 20/22 were not run locally; CI retains that matrix.

Status notes concern deliberately preserved embedded/artwork palettes, browser-specific rendering, and manual checks. The 7:1 measurement scope is top-document HTML text; the embedded fixture remains owner-controlled at 6.73:1, described below. No universal host conformance claim is made.

## What changed (files and why)

- fixtures/colour-lab.* plus original SVG, silent local MP4 and embedded frame: text, forms, gradients/background images, image/video/canvas/SVG/iframe, fixed/sticky content, native modal and a 2,000-block heavy variant. No third-party assets.
- e2e/colour-prototypes.spec.ts and docs/adr/0002-colour-strategy.md: compared filters and palettes before feature implementation; retained the earlier content-scaling ADR despite the requested duplicate number.
- src/features/dark-mode.ts and high-contrast.ts: separate palette variables and selector precedence; remove decorative backgrounds where text needs an opaque surface; preserve semantic artwork/media.
- src/features/monochrome.ts and low-saturation.ts: separate metadata modules using reversible paint classification, grouped RGB conversion, background luminosity blending and atomic-media saturation.
- colour-rules.ts, colour-mix.ts, saturation.ts and marks.ts: shared ownership, RGB parsing, media boundaries and typed SVG markers. Page rules remain in one owned sheet; page-element inline styles are never written.
- src/core/types.ts/options.ts and src/ui/panel.ts/styles.ts: optional translatable Messages.forcedColoursNote. The operating-system note appears through CSS when forced colours are active; controls remain generated from registry metadata.
- Unit/browser tests and architecture documentation cover combinations, dynamic owner changes, natural media, network inactivity, print, forced colours, persistence, cleanup and accessibility.

## Verification (commands run, real results)

| Command / probe                                       | Observed result                                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| npm run verify                                        | Passed lint, formatting, typecheck, 147 tests in 40 files, build, plain-Node SSR and size                              |
| Coverage                                              | All source 98.29% lines / 94.68% branches; core 98.86% lines / 97.83% branches                                         |
| Reviewed full browser run                             | 598 passed, 2 existing skips, 6.4 minutes; six additional reset checks passed afterward                                |
| Headed colour accessibility audit                     | 12 passed across all three engines                                                                                     |
| Forced-colour transition stability                    | 9 passed: three consecutive checks per engine                                                                          |
| Natural media plus linked artwork/fallback regression | 9 passed across all three engines after fixes                                                                          |
| First-frame persistence                               | 12 passed: every mode in all three engines, five adjusted frames each, using a blocking head script after owner styles |
| Independent reset audit                               | 6 passed: exact markup, computed paints and foreign sheet identity; one owned page sheet while active                  |
| npm audit; npm audit --omit=dev                       | Both 0 vulnerabilities                                                                                                 |
| npm run check:package                                 | publint and Are the Types Wrong passed                                                                                 |
| git diff --check                                      | Passed                                                                                                                 |

The first full run had 594 passes, two existing skips, and one WebKit assertion failure while reading immediately after media emulation. R-4 now awaits the exact required white-on-black result. The reviewed run above followed the fix. No coverage, size, axe or timing gate was weakened. The two skips are the existing Chromium/CDP-only supplemental paths on Firefox/WebKit, not colour feature tests.

Build outputs: ESM 45,006 bytes, CJS 45,480, IIFE 45,505 and each declaration entry 3,902; sourcemaps emitted. Plain Node ESM/CJS import and inert lifecycle checks passed.

The eight feature hosts are article, legacy-px, rem, flex, table, form, fixed-header and colour-lab. Each runs under dark, contrast, monochrome, low saturation, dark+monochrome, contrast+low saturation and all four together in all three engines. The embedded frame is also visible within the laboratory. The heavy query variant is benchmarked rather than captured as an enormous full-page image.

## Review findings and fixes

Self-review covered AGENTS.md sections 2, 7 and 9. All identified High and Medium findings were fixed separately.

| Severity | Finding                                                                                                                      | Fix                                                                                                                                               | Status |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Medium   | R-1: link/placeholder palette selectors could escape artwork boundaries, including linked currentColor SVG                   | 172940a restricts those selectors and adds three-engine regression coverage                                                                       | Fixed  |
| High     | R-2: filtering an object with HTML fallback displaced fixed descendants; Firefox reproduced 140px to approximately 1226.77px | 763273e skips media containing HTML layout fallback, while allowing SOURCE/TRACK/PARAM metadata; exact bounds checked after fallback has rendered | Fixed  |
| Low      | R-3: video loading UI appeared instead of a decoded frame in mode screenshots                                                | 470b90c waits for a presented frame before capturing laboratory evidence                                                                          | Fixed  |
| Low      | R-4: immediate computed-style reads raced WebKit's forced-colour transition                                                  | 935486d polls the exact expected palette; nine repeated checks passed                                                                             | Fixed  |

The first fallback regression baseline was sampled before Chromium/WebKit had rendered fallback content. It now waits for visibility before taking the exact baseline; the comparison remains exact. Initial whole-PNG equality in the prototype was also replaced by original coloured interior samples, avoiding raster edge/position metadata differences while still detecting filter colour changes.

Audit evidence and 177 screenshots were committed in db9c9a9; independent reset coverage is d63996b.

## Audits

### Accessibility (evidence)

There are no manually excluded elements in axe scans and no suppressed axe rules. Colour-contrast scans cover the whole text fixture page; full widget scans cover all seven modes/combinations; additional full-page scans cover closed/open laboratory states with normal and forced colours. All reported zero violations in the passing runs.

Top-document sampled text exceeds 7:1 in palette modes and their combinations. Measured mode minima from the reviewed run: dark 12.9292:1; contrast 19.5560:1; dark+monochrome 12.7636:1; contrast+low 18.0978:1; all four 17.9375:1. Explicit base pairs are white/#121212 at 18.7337:1, light-blue links/#121212 at 12.9292:1, white/black at 21:1 and yellow/black at 19.556:1.

Palette scope intentionally excludes replaced media, SVG/MathML and semantic image subtrees. Iframe document text, canvas pixels and text baked into artwork are not rewritten. The embedded frame's original white/#2050d0 pair is 6.7314:1: it passes AA colour-contrast but is outside the top-document 7:1 claim. No iframe is excluded from axe. Owners must audit or theme embedded content separately if they need 7:1 there.

Panel text contrast in each colour mode is at least 7.5558:1 in the measured light theme; minimum measured boundary contrast 3.6876:1 includes a disabled control, and active boundaries are 4.0852:1. The focus outline is 3px with 7.3210:1 contrast. Native radio inputs measure 24×24px, buttons at least 44px high, colour toggles 45px high, and launcher 48×48px. Existing dark/forced-colour and small-viewport UI regression tests also ran.

The real headed keyboard walk used Alt+A, native Tab (Option+Tab in macOS WebKit), Space on all four colour toggles, exit without a trap, and Escape focus return. Semantic snapshots show named buttons with aria-pressed and descriptions. Repeated Off choices remain contextualized by content radiogroups. No new screen-reader ambiguity was observed from semantic evidence; actual speech and the forced-colour note need a human check.

| WCAG / behavior touched    | Result                                  | Evidence                                                           |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| 1.4.3, 1.4.11              | Pass for widget and scoped text samples | Measured text/boundary/focus ratios and axe above                  |
| 1.4.1, 4.1.2, 4.1.3        | Pass in automated checks                | Persistent names, aria-pressed, visible On/Off badge, live region  |
| 2.1.1, 2.1.2, 2.1.4, 2.4.3 | Pass                                    | Headed modifier shortcut, Space toggles, native tab order and exit |
| 2.4.7, 2.4.11              | Pass in tested layouts                  | Focus evidence and prior host-focus collision tests                |
| 2.5.3, 2.5.7, 2.5.8        | Pass                                    | Visible labels, no dragging, measured targets                      |
| 1.1.1, 1.3.1               | Pass                                    | Original media alternatives, labelled groups and controls          |
| 1.4.4, 1.4.10, 1.4.12      | Pass in regression paths                | Previous reflow/zoom/text-spacing suite remains active             |
| 1.4.13                     | n/a                                     | No tooltips                                                        |

177 screenshots cover all eight hosts under seven mode combinations in three engines, plus nine native-modal captures. Visual inspection included the laboratory in natural/dark/desaturated modes and the native modal, with representative text/form/fixed hosts. Native modal focus, close behavior and fixed/sticky anchoring passed; the widget does not defeat host-modal inertness.

No browser-tool connector is available; the keyboard walk used headed Playwright, local screenshots and semantic trees. No human screen-reader or physical mobile session was run.

### Security and privacy

Zero runtime dependencies, no dependency additions, unchanged lockfile and both npm audits clean. Existing development tooling remains in use. Source searches found no network APIs, unsafe DOM APIs, font loading or new storage. No secrets, environment files or generated dist/coverage/test output were added.

Only the established configured localStorage key persists settings. Browser media tests recorded zero requests during adjustments. Saturation never re-emits background image URLs; URL-bearing owner filters are deliberately left untouched. Original fixture resources and explicit test playback are host/test actions, not widget requests.

All page colours are sheet-driven through html classes/variables and reversible markers. Cleanup removes listeners exactly once, including resize, stylesheet load and system-colour change. Constructed sheets remain preferred; nonce fallback uses the same owned-sheet infrastructure and retains foreign sheets. CSP does not gain script or external-font exceptions.

### Performance and size (numbers)

The before-implementation strategy experiment measured 60 frame intervals for a 2,000-block heavy host, with and without an html invert/hue-rotate/contrast filter. This is frame scheduling evidence, not GPU paint-duration measurement.

Before-implementation intervals, milliseconds (median / p95 / maximum):

| Browser  | No filter          | Root invert + hue rotation + contrast |
| -------- | ------------------ | ------------------------------------- |
| Chromium | 16.7 / 16.9 / 17.2 | 16.6 / 17.1 / 17.6                    |
| Firefox  | 8 / 9 / 10         | 8 / 60 / 72                           |
| WebKit   | 33 / 42 / 46       | 33 / 42 / 45                          |

The reviewed full run repeated this experiment: no-filter/root-filter p95 was 17.5/17.5ms Chromium, 10/59ms Firefox and 42/42ms WebKit.

Chromium long-task observations: 0 entries in both strategies, in both the initial and reviewed experiment. Firefox/WebKit do not expose the long-task API here and are null, not claimed zero. The raw baseline strategy and reviewed-run measurements are committed separately. Browser timings vary by hardware, refresh rate and load; no cross-engine speed ranking is implied.

Root html filters kept fixed probes at 0px/120px in the three engines, but body filtering displaced them to about -395px/-275px. Root filter plus counter-filter changed image colour samples in all engines. The chosen strategy filters neither root nor layout containers; media sample equality, sticky/fixed tests and the fallback regression pass.

IIFE gzip is **15,742 bytes**, versus Phase 3 **14,087 bytes**: **+1,655 bytes**. This is below the 30,000-byte warning and 35,000-byte hard limit. Production initialization/host-layout regression evidence: ten cycles per engine peaked at 1.3ms Chromium, 3ms Firefox and 2ms WebKit; host rectangles stayed identical and Chromium CLS was 0. Firefox/WebKit layout-shift entries were unavailable.

## Known limitations (honest)

- Stronger/inline-important author rules, opacity, masks, blend modes, pseudo-elements and text on semantic artwork can resist or complicate palette contrast.
- Palette overrides remove decorative backgrounds, potentially removing meaning conveyed only through CSS backgrounds. Prefer semantic images and text alternatives.
- Embedded documents, canvas/video/SVG pixels and semantic image subtrees keep owner palettes in dark/high-contrast mode. The specific 6.73:1 embedded fixture exception is reported above; arbitrary cross-origin content cannot be rethemed.
- Low saturation preserves 35% chroma for parsed paints/media, but background images/gradients become fully achromatic. Unknown wide-gamut colour functions and URL-bearing media filters remain owner-controlled.
- Media with HTML fallback or foreignObject layout is not filtered, preserving positioning at the cost of saturation coverage.
- New/style/class/visibility/role changes, resize and stylesheet-load events reconcile; arbitrary CSSOM mutations without observed events can require reinitialization or toggling.
- Early restoration is demonstrated with a blocking head script after owner styles. Late-loaded widgets cannot undo an earlier unadjusted paint.
- Native host modals can cover/inert the widget. User-agent video-control rendering and codec output differ across engines; natural-media assertions compare each engine against its own original samples.
- Actual assistive-technology speech, desktop toolbar zoom and physical devices remain human checks. Personalisation does not establish site WCAG conformance.

## Deviations from the prompt (and why)

The requested ADR filename duplicates the existing number; both differently named 0002 ADRs remain. This follows the explicit filename without rewriting prior documentation.

The public init/destroy/options/instance contract is unchanged. Messages adds one optional translation field for the requested system-colour note. The 7:1 claim is scoped to top-document HTML, with preserved embedded/artwork exceptions explicitly disclosed. No element or rule was hidden from axe to achieve passing results.

## Handoff notes for the next phase

Add navigation modules through the registry. Keep all page rules in the owned sheet, preserve font preloading/no-network behavior, and never place filters on layout ancestors. Preserve the fallback-media and linked-artwork guards.

Human next: review CI Node 20/22, try NVDA/VoiceOver including forced-colour note and live announcements, and audit a real host's decorative/embedded content. Theme the embedded document itself if 7:1 is required inside it. Publishing remains human-only.

## Phase commit list

Implementation and audit commits before this report, newest first:

```text
db9c9a9 docs(audit): record colour screenshots and measured evidence
d63996b test(colour): prove reset separately from destroy
a71ffdc docs(adr): record the fallback-layout filter boundary
935486d test(colour): await the exact palette after media changes
470b90c test(evidence): capture decoded video in colour screenshots
763273e fix(saturation): preserve layout inside fallback media
e7a2de5 docs(architecture): describe colour ownership and system overrides
2dd7eb3 docs(adr): record background blending and URL-filter limits
a3d4248 test(colour): preserve native modals and sticky anchors
172940a fix(colour): preserve linked semantic artwork
aa91c73 test(audit): walk colour controls and validate dynamic paints
3d83677 test(colour): prove listener cleanup and preserve URL filters
2c7e606 test(persistence): restore each colour mode before first paint
354ab7d test(media): preserve natural palette paint without requests
cf0e13c test(colour): cover all combinations, system colours and print
ac1e2da test(colour): cover fixtures, contrast, panels and exact cleanup
9e95483 feat(panel): explain operating-system forced colours
57a9c45 feat(low-saturation): register deterministic reduced chroma
000b8b9 feat(monochrome): register a paint-only greyscale toggle
a6e867b feat(colour): own reversible paint-only saturation adjustments
30cad83 feat(colour): mix parsed RGB paints without changing geometry
425842b refactor(markers): support typed non-HTML media ownership
23a79d1 feat(high-contrast): register an order-independent strong palette
3734429 feat(dark-mode): register reversible dark surfaces and light text
fc49088 feat(colour): define isolated screen-only palette rules
9f8d7b0 docs(adr): choose measured palette and saturation strategies
a6faf62 test(colour): compare palettes and filters before implementation
13dbb88 test(fixtures): add original colour and media strategy laboratory
```
