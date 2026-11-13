# Phase 5 — Navigation features

Status: PASS WITH NOTES

Date: 2026-11-13. Commit range: `phase-4-complete` (`c43655b`) to `phase-5-complete`. The annotated tag identifies the final report commit.

## Summary

All eighteen features are now registered. This phase adds reading guide and mask, link and heading highlights, two cursor sizes, animation suppression, and keyboard focus highlighting. All page changes are scoped, reversible, and independent of the isolated panel. The mask deliberately dims gently rather than producing a stark moving spotlight.

Preflight: read AGENTS.md completely; constants contained no placeholders; main was clean; `git pull --ff-only` returned already up to date; `phase-4-complete` existed. Node 24.13.0, npm 11.6.2, git 2.50.1. Work remained on main with fast checks before each granular commit.

## What changed (files and why)

- Seven feature modules in `src/features/`, registered in catalogue order. Link selectors include graphical SVG links, not just text elements. Heading badges use CSS generated content without changing host markup.
- `reading-overlay.ts` coalesces pointer, touch, focus and viewport updates into one requestAnimationFrame per overlay. Both surfaces are noninteractive and hidden from assistive technology. Opening the panel hides them.
- `core/presentation.ts` delays rendering until the existing shadow host mounts. `core/surface-styles.ts` shares a private placement sheet: movement does not rebuild page-adjustment CSS or trigger whole-page font/colour baseline reads. Page rules still share the single document stylesheet.
- Focus geometry measures top-edge fixed/sticky obstructions, adds reversible root scroll padding, and adjusts newly focused content. Header links do not mistake their own container for an obstruction. Oversized controls remain partly exposed.
- Stop animations pauses CSS timelines and autoplay video, blocks transitions and smooth scrolling, and watches newly inserted autoplay media. Turning it off never starts playback on the user's behalf.
- Cursor schema adds value `2` (extra large, 48 px), preserving `false` and `true` (large, 32 px). Original inline SVG cursor assets have native fallback. Generic metadata-driven controls explain unavailability for touch-only/forced-colour environments.
- Integration, geometry, media, touch, cleanup, flash-bound, CPU and retained-heap tests; 21 screenshots and raw measurements under `reports/assets/phase-5/`. Architecture documentation explains ownership, CSP, restoration and cross-site limits. Fixture favicons avoid an unrelated missing-resource console error in headed Chromium.

## Verification (commands run, real results)

`ACCESSIBLIT_NAVIGATION_EVIDENCE=1 npx playwright test --workers=1`: **684 passed, 6 skipped, 0 failed** in 7.8 minutes. Four skips are the two new CDP-only measurements in Firefox/WebKit; two are pre-existing Chromium-only instrumentation checks. All functional tests ran in Chromium, Firefox and WebKit. All-feature axe checks reported **0 violations** with panel closed/open in normal and forced colours (12 scans), alongside the retained broader accessibility regressions. The all-18-feature smoke cases recorded no console errors or page errors.

Raw data: [measurements](assets/phase-5/measurements.json), [headed keyboard walk](assets/phase-5/headed-keyboard.json), [flash bounds](assets/phase-5/flash-safety.json), and [screenshots](assets/phase-5/).

`npm run verify`: lint and Prettier, strict TypeScript, 163 unit tests, coverage gates, ESM/CJS/IIFE/declarations/maps, plain-Node SSR check and size gate passed. Global coverage: 95.87% lines, 89.82% branches; core: 98.63% lines, 97.96% branches. IIFE gzip: 19,255 bytes versus 15,742 in Phase 4: +3,513 bytes; below both 30,000 warning and 35,000 budget.

Targeted three-engine checks passed: navigation styles 6; focus geometry 15; overlays 12; motion/cursors/system media 12; all-feature panel smoke 18; repeated all-feature lifecycle 6; legacy colour audit 12. Headed Playwright runs passed all 18 all-feature panel cases after the favicon fix and all 9 reading-surface audits. Chromium 158.0.8127.18, Firefox 159.0, WebKit 27.2 on this Mac. No browser connector was available; headed Playwright provided the real browser keyboard walk.

`npm audit` and `npm audit --omit=dev`: zero vulnerabilities. `npm run check:package`: publint all good; Are the Types Wrong found no problems across its CJS/ESM/bundler checks. No dependency or lockfile changes.

One early attempt to run a coverage command on only the touched UI tests correctly failed the repository-wide coverage thresholds (46.8% lines). Targeted tests were then run without partial coverage; the complete coverage run above passed unchanged gates.

## Review findings and fixes

| Severity | Finding                                                                                  | Fix                                                                                                            | Status |
| -------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| Medium   | R-1: fallback heading badge selector outweighed native levels                            | `9ca5da7`: use zero-specificity base; browser assertions check H1, H2 and custom levels and accessible names   | Fixed  |
| Medium   | R-2: saturation refresh could cache the temporary white focus shadow                     | `0cc8174`: exclude focus class while reading paint baselines; focus/change font/blur regression in all engines | Fixed  |
| Medium   | R-3: fixed-header links could scroll their own page; oversized targets skipped clearance | `9bd00bc`: ignore target ancestors as obstructions and expose large targets partially                          | Fixed  |
| Low      | R-4: headed Chromium requested absent fixture favicon and failed the console-error gate  | `847e0cd`: original embedded fixture favicon; no console filtering                                             | Fixed  |
| Medium   | R-5: text-only selectors omitted graphical navigation links and pointer targets          | `f2f7b54`: use broad private-host-excluding navigation selector; SVG link regression                           | Fixed  |
| Low      | R-6: older colour audit would toggle newly registered navigation buttons                 | `9c9b4ef`: scope colour actions to its four labels; separate all-feature keyboard walk covers navigation       | Fixed  |

No outstanding Blocker, High or actionable Medium findings from review against AGENTS.md sections 2, 7 and 9. No quality gate was lowered.

## Audits

### Accessibility

Keyboard walk in headed Chromium, Firefox and WebKit: open using Alt+A, Tab through native controls including the new cursor radio group and seven navigation features, pass Reset and leave the non-modal panel without a trap, reopen, focus Stop animations, Space off/on, Reset, then Esc and observe focus return to the launcher. WebKit uses platform Option+Tab to include all controls. At 320 × 256, the panel scrolls vertically and the focused control remains visible. Screenshots show the current scrolled position rather than claiming the entire panel fits at once.

Semantic inspection: three named regions, native radio groups with their labels, toggle states, named close/reset controls, one named non-modal dialog, and hidden noninteractive reading surfaces. No new confusing unnamed control was found. CSS heading badges use an empty accessibility alternative where supported; actual screen-reader speech remains a human check, especially browser fallback handling of generated content.

| WCAG criterion | Result                         | Evidence                                                                                                                |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1.1.1          | Pass                           | SVG launcher hidden from AT; reading overlays aria-hidden                                                               |
| 1.3.1          | Pass                           | Named groups/headings/native radio semantics; all eighteen registry entries rendered                                    |
| 1.4.1          | Pass                           | Link outline + underline; heading outline + text badge; toggle text/state                                               |
| 1.4.3, 1.4.11  | Pass on measured fixtures      | All-feature computed text/boundary/focus contrast and axe checks; exact minima in raw evidence                          |
| 1.4.4, 1.4.10  | Pass on tested viewports       | 320 × 256 panel, 200% page content scale with 200% font scale; no panel horizontal overflow                             |
| 1.4.12         | Pass on tested UI              | Host maximum spacing does not affect the isolated panel; existing panel spacing audit retained                          |
| 1.4.13         | N/a                            | No tooltips                                                                                                             |
| 2.1.1, 2.1.2   | Pass                           | Complete native tab cycle, radio pattern, keyboard actions, no trap                                                     |
| 2.1.4          | Pass                           | Modifier shortcut, configurable/disableable; existing shortcut regression retained                                      |
| 2.3.1          | Pass for tested overlay bounds | No animation/transition; mild mask and small guide; numerical bounds below                                              |
| 2.4.3, 2.4.7   | Pass                           | Logical registry order and visible panel/page focus rings                                                               |
| 2.4.11         | Pass on tested fixture         | Panel scrolls focused control into view; page header clearance tested at 100/200% scale; fixed links do not self-scroll |
| 2.5.3          | Pass                           | Visible label matches accessible name; semantic snapshots                                                               |
| 2.5.7          | Pass                           | No drag-only interaction; pointer, touch and keyboard alternatives                                                      |
| 2.5.8          | Pass                           | Every computed panel target at least 24 × 24; measured minimum in raw evidence                                          |
| 4.1.2          | Pass                           | Named native controls, pressed/expanded/checked states and dialog name                                                  |
| 4.1.3          | Pass                           | Existing live-region announcements exercised by reset/change tests                                                      |

Reduced-motion introduces no new overlay animation. Forced colours uses CanvasText/Canvas/GrayText/Highlight rather than custom dimming or cursors. Touch emulation in all three engines reports no fine pointer, uses the native cursor, shows the explanation, follows touch and preserves click-through. This is emulation, not physical iOS/Android hardware testing.

Page focus uses a 3 px black outline and a 6 px white shadow (3 px exposed as the second tone), a 21:1 contrast between tones. Forced colours delegates to Highlight. The sticky-header fixture has a 76 px obstruction at 100% and 152 px at 200%; focus is moved below it with 8 px clearance. This mitigates that fixture, not arbitrary nested scroll regions or all author overlays.

The 4% black mask has a worst-case relative-luminance change of **0.0885924996**. Exhaustive 24-bit sRGB analysis checked 16,777,216 colours, including 1,217,391 saturated-red candidates; maximum CIE u′v′ distance was **0.0023816186**. The corresponding general/red thresholds are 0.1/0.2 in the [current W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html). Browser geometry confirms the guide is 3 px high. This bounds this implementation's changes; it is not a PEAT analysis, HDR certification or a guarantee about an already-flashing host page.

Computed all-feature UI minima were identical across the three engines:

| Profile                   | Smallest target | Text contrast | Control boundary contrast | Focus contrast |
| ------------------------- | --------------- | ------------: | ------------------------: | -------------: |
| Light                     | 24 × 24 px      |      6.8204:1 |                  3.6876:1 |       7.3210:1 |
| Dark                      | 24 × 24 px      |      7.8679:1 |                  4.9163:1 |       9.9400:1 |
| 320 × 256, reduced motion | 24 × 24 px      |      6.8204:1 |                  3.6876:1 |       7.3210:1 |
| 320 × 256, forced colours | 24 × 24 px      |          21:1 |                      21:1 |           21:1 |

### Security and privacy

No runtime dependency, runtime request API, unsafe DOM construction, external asset, new storage location or analytics was added. Cursor/favicons are original data URIs. Pointer/focus coordinates remain transient in closures, never persisted or passed to onChange. The existing guarded single-key adapter remains the only localStorage access. Source search found no fetch, XMLHttpRequest, sendBeacon, innerHTML, eval, Function construction or video.play in runtime source. No credentials were read or committed. CI permissions remain contents: read, with no secret echoes.

CSP: the configured nonce reaches fallback shadow sheets; adopted sheets are preferred when supported. Custom cursor data URIs may require img-src data: permission; otherwise native cursor fallback applies. No font requests are introduced; owner-preloaded dyslexia font policy remains unchanged.

### Performance and size

The full-run CPU sample recorded 250 pointer events in each window: overlays off **0.4941%** (9.963 ms task CPU / 2,016.4 ms wall), on **3.8082%** (77.264 / 2,028.9 ms), then off **1.1771%** (23.687 / 2,012.4 ms). Enabled script time was 20.165 ms; CDP LayoutDuration delta reported 0 ms (counter granularity, not proof of no layout work).

| Feature           | Retained JS heap growth after 200 measured toggles (bytes) | DOM/listener counters before → after |
| ----------------- | ---------------------------------------------------------: | ------------------------------------ |
| readingGuide      |                                                     61,680 | 192 nodes / 27 listeners → same      |
| readingMask       |                                                      7,896 | 192 / 27 → same                      |
| highlightLinks    |                                                     25,172 | 192 / 27 → same                      |
| highlightHeadings |                                                      3,456 | 192 / 27 → same                      |
| bigCursor         |                                                     11,520 | 218 / 29 → same                      |
| stopAnimations    |                                                      4,080 | 195 / 27 → same                      |
| focusHighlight    |                                                      6,632 | 195 / 27 → same                      |

No owned overlays or feature classes remained at the checkpoints. A second browser document appears during the cursor sample; attribution to SVG decoding and its retained heap contribution were not isolated. Nonzero growth remains visible in the evidence rather than being dismissed as zero.

Protocol: minified IIFE, 2,000-paragraph fixture with sixteen other features enabled; synthetic pointer events at approximately 120 Hz for two seconds, overlays off/on/off. Chromium CDP threadTicks measures main-thread task CPU, not whole-machine/GPU utilisation. No hard CPU gate was invented.

Leak protocol: each navigation feature receives 200 warm-up toggle cycles and 200 measured cycles with GC checkpoints at 50, 100 and 200. Reading/focus features present a frame while enabled. Retained JS heap is reported rather than asserted to be exactly constant; browser caches/JIT can contribute and their precise attribution is unproven. CDP counters are Chromium-only; Firefox/WebKit explicitly skip these two supplemental measurements while running functional and cleanup checks.

Production init over ten cycles per engine: maximum 4.6 ms Chromium, 12 ms Firefox, 8 ms WebKit (all below 50 ms). Chromium reported CLS 0; Firefox/WebKit did not expose layout-shift entries, so their CLS value is unavailable. All engines measured a 0 × 0 host box and exact DOM restoration.

Listener evidence: paired overlays add/remove **36/36** listeners with zero remaining after off or destroy, and no pending owned frames. Repeated all-feature init/destroy records **224 additions and 224 removals** per browser and restores original DOM, html attributes/classes, head and adopted sheet identities. Both constructable and nonce fallback sheets pass. These ownership checks support cleanup independently of heap noise.

## Known limitations (honest)

- Cross-origin iframes, internal shadow trees and canvas internals are outside these selectors/focus tracking. GIF/APNG, canvas, JavaScript animation and SVG SMIL cannot be stopped by CSS pause. Autoplay video deliberately stays paused after disabling the feature; the owner/user can resume it.
- Heading badges temporarily replace author ::after content. Native SVG pseudo-element rendering and generated-content screen-reader fallback vary. Dynamic/custom headings without a level show H, not an invented hierarchy.
- Custom cursors are mouse/trackpad aids, subject to browser/CSP/OS size restrictions; screenshots cannot verify the OS-drawn cursor appearance. Touch-only devices use the native behaviour.
- Top-edge header mitigation does not solve every nested scroller, bottom overlay, author focus handler or huge control. Oversized controls can only be partly visible; manual scrolling is not continuously overridden.
- Older environments without popovers, ancestor transforms/clipping and author styles with extreme precedence remain cross-site risks. Reading strip coordinates clamp at viewport edges; zoom is tested at 100/200%, not every possible combination.
- The gentle 4% mask is intentionally subtle. No whole-site WCAG compliance claim is made. Phase 4's cross-origin frame/media contrast limits remain.
- CPU/heap numbers are local samples, not guarantees on all devices or proof of zero retained allocations. Physical mobile, screen-reader speech and HDR/flash tooling require human validation.

## Deviations from the prompt (and why)

The section 5 public init/options/instance contract is unchanged. Internal FeatureApi gains onHost and feature metadata gains a fine-pointer requirement; both are additive. bigCursor gains numeric 2 while preserving legacy booleans; Messages gains an optional explanatory string. Private overlay placement uses one shared shadow sheet, while all page-affecting rules stay in the single document sheet. This prevents pointer motion from invalidating expensive page baselines.

No standalone browser connector was available; real headed Playwright performed the keyboard audit. CPU and heap are measured on Chromium only because precise CDP counters are unavailable on Firefox/WebKit. All functional scenarios run in all three. Paused video is not restarted on reset/destroy: initiating media playback would surprise users and could initiate host resource activity. CSS, DOM, styles and listeners are fully restored.

## Handoff notes for the next phase

Run the new all-feature suites when extending controls or changing shared CSS. Preserve independent placement-sheet ownership and exclude transient page focus rings from saturation baselines. Human follow-up: inspect actual cursor appearance, test screen-reader announcements and heading badge speech with NVDA/VoiceOver, and test physical mobile and representative host sites. Publishing remains human-only.

## Phase commit list

```text
dc29947 docs(audit): record navigation browser and performance evidence
9c9b4ef fix(tests): keep the colour walk scoped to colour controls
f2f7b54 fix(navigation): include graphical links and pointer targets
847e0cd fix(fixtures): supply an original inline favicon for browser audits
16a2de9 test(audit): inspect reading surfaces in real browser media modes
15c1031 docs(architecture): describe navigation ownership and limitations
0af0f54 test(lifecycle): restore all eighteen features through repeated mounts
de99769 test(performance): measure overlay CPU and two hundred toggle cycles
5642c03 test(integration): keep the panel usable with all eighteen features
5541ac9 test(mask): bound luminance and red-flash changes in sRGB
1889dc3 test(navigation): verify media pause, cursor sizes and system modes
9bd00bc fix(focus): account for fixed links and oversized controls
57baac4 refactor(catalogue): expose all eighteen features in catalogue order
ad768a4 test(overlays): verify following, click-through and listener cleanup
0cc8174 fix(saturation): exclude transient focus rings from paint baselines
f011376 feat(focus-highlight): add two-tone rings and header clearance
8986a9e feat(focus): measure visible top-edge header clearance
2a40ace feat(reading-mask): register a gentle focus-following strip
ba07576 feat(reading-guide): register pointer and focus following
44e1f69 feat(overlays): coalesce pointer and focus tracking in private frames
d5f7bd8 feat(surfaces): share an isolated placement sheet for overlays
e4435a8 feat(stop-animations): pause CSS motion and autoplay video
7b8ef0e feat(big-cursor): add two original embedded pointer sizes
9ca5da7 fix(headings): let native level rules override the badge fallback
47845a5 feat(highlight-headings): add reversible CSS level badges
e34abba feat(highlight-links): outline and underline semantic links
60e4341 feat(controls): explain fine-pointer availability from metadata
5bc9f7a feat(lifecycle): defer feature surfaces into the existing host
6e80971 feat(schema): support a second cursor size without losing booleans
```

This report is committed separately as `docs(report): record phase five navigation audit`; the completion tag includes that final documentation commit.
