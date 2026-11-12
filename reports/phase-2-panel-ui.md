# Phase 2 — Accessible launcher and panel

Status: PASS WITH NOTES
Date: 2026-11-12. Range: `phase-1-complete` (`7a0b8ee`) → `phase-2-complete` (this report commit).

## Summary

The launcher, named non-modal panel, generated controls, keyboard handling, live announcements and reversible UI lifecycle are implemented. The required closed/open media matrix passes in Chromium, Firefox and WebKit with **zero axe violations**. Final browser suite: **118 passed**, with **two skips only for the additional Chromium CDP pinch-zoom probe on engines without CDP**. Every required browser/profile remains enabled. The full verify, package checks and dependency audits pass.

This phase initially stopped at `601a34a` with a Firefox crash and no push/tag. The human explicitly authorized resuming Phase 2 before Phase 3. The required crash reproduction is fixed by an explicit dialog name; an additional Firefox interaction between axe and Playwright semantic traversal is mitigated by independent audit pages and documented below. This report supersedes the earlier blocked report without rewriting its commit.

At phase start, AGENTS.md was read completely, main was clean, `git pull --ff-only` succeeded and the Phase 1 tag existed. The resumed work also began on clean main with a successful ff-only pull. All changes stayed on main with pre-commit lint, typecheck and relevant unit checks, separate logical commits and separate review fixes. No published history was rewritten.

## What changed (files and why)

- `src/ui/launcher.ts`: original decorative inline SVG, named 48×48 button, expanded/controls state and click handling.
- `src/ui/panel.ts`: explicitly non-modal dialog, visible title, introduction, three named sections, Close and Reset all. An explicit localized aria-label matches the heading; a generic header wrapper avoids a spurious document banner landmark.
- `src/ui/{control-types,presentation,toggle,stepper,radios}.ts`: registry-driven labels/descriptions, visible On/Off state, bounded increase/decrease controls with values, native radio groups and metadata-derived announcements. Rendering never switches on a concrete feature id.
- `src/ui/{keyboard,placement,layer,controller,styles}.ts`: physical-code modifier shortcuts, focus return and host-focus protection, logical placement, native manual popovers, fixed fallback, system appearance, responsive vertical scrolling and complete resource ownership.
- `src/core/{types,options,lifecycle}.ts`: UI copy, partial feature wording overrides, optional range units/select labels, queued opening before body, store-to-control updates, reset/value announcements and UI teardown. `src/core/styles.ts` synchronizes lazy CSSOM serialization before removing an originally absent style attribute.
- `tests/ui/`, core/API tests, `tests/helpers/panel-features.ts`, `fixtures/panel.html` and `e2e/panel*.spec.ts`: all renderer kinds, host focus targets, media/axe/contrast, keyboard, RTL, zoom, spacing, text resizing, exact restoration and performance evidence.
- `e2e/style-restoration.spec.ts`: ten-cycle browser regression for the lazy empty-style-attribute residue.
- `docs/architecture.md`: actual UI lifecycle, focus/CSP behavior, isolation contract, fallback limits and audit commands.
- `reports/assets/phase-2/`: six headed screenshots, three semantic trees, raw per-engine lifecycle/state measurements, 48 media measurements and three headed keyboard traces.

Production feature effects remain for later phases. Its three groups explain that no options are available until real metadata is registered. Four test-only features exercise the panel fixture; none is imported by the production entry. Short descriptions wrap for reflow rather than being truncated to one visual line.

## Verification (commands run, real results)

Environment: Node **v24.13.0**, npm **11.6.2**, git **2.50.1**, Chromium **158.0.8127.18**, Firefox **159.0**, WebKit **27.2**. Measurements describe this environment, not all host sites or hardware.

| Command                                                                                                                                                          | Observed result                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                                                                                                                                                 | PASS. Lint, typecheck, **109 unit tests in 24 files**, build, plain Node SSR checks and size.                                                                       |
| Coverage                                                                                                                                                         | All source: **98.43% lines (879/893), 96.54% branches (475/492)**. Core: **98.83% lines, 98.09% branches**. UI: **97.85% lines, 93.78% branches**. Gates unchanged. |
| `npm run test:e2e -- --workers=3`                                                                                                                                | **118 passed, 2 supplemental CDP skips**. All mandatory tests run in all three engines.                                                                             |
| `ACCESSIBLIT_AUDIT_WRITE=1 npm run test:e2e -- e2e/panel-audit.spec.ts e2e/panel.spec.ts e2e/focus-svg.spec.ts e2e/focus-indicator.spec.ts --headed --workers=1` | **21 passed**: 12 keyboard/interaction cases, 3 SVG-focus cases, 3 pointer-to-shortcut cases and 3 evidence audits in real headed browsers.                         |
| Opt-in evidence mode in the headed command above                                                                                                                 | **3 passed** after final code changes. Saved screenshots, semantic trees, active-state axe results, lifecycle/CLS and network evidence.                             |
| Media matrix                                                                                                                                                     | **48 profiles × closed/open = 96 axe scans, 0 violations**. Two viewport sizes × light/dark × forced colours off/on × reduced motion off/on × three engines.        |
| Active-state audit                                                                                                                                               | Six additional full axe scans: all test controls enabled at max, dark scheme with forced colours off/on, all engines: **0 violations**.                             |
| `npm run check:package`                                                                                                                                          | publint “All good”; Are The Types Wrong “No problems found”.                                                                                                        |
| `npm audit`; `npm audit --omit=dev`                                                                                                                              | Both **0 vulnerabilities**.                                                                                                                                         |
| Exact restoration                                                                                                                                                | Ten init/open/close/change/reset/destroy cycles per engine restore the entire fixture DOM; unit teardown also counts listeners and disconnects observers/timers.    |

All ESM/CJS/IIFE bundles, source maps, `.d.ts` and `.d.cts` build. The build's actual plain Node ESM/CJS import checks avoid a throwing browser-global getter and verify inert SSR lifecycle behavior. Fresh npm ci and Node 20/22 compatibility installs were not repeated for this phase; dependency and CI files are unchanged.

## Review findings and fixes

| Severity | Finding                                                                                                             | Fix                                                                                                                                        | Status                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Medium   | R-1: Safari transient focus loss before pointer activation dismissed the panel prematurely.                         | `267d928`: close on actual external focus, not transient null blur; unit regression and headed interactions.                               | Fixed                                                        |
| Medium   | R-2: system Highlight could be translucent behind the launcher.                                                     | `e2964ed`: initial system surface pairing; refined across dark themes by R-8.                                                              | Fixed by R-8 refinement                                      |
| Medium   | R-3: fixture colours conflicted with forced dark backgrounds.                                                       | `179db08`: explicit host system colours; whole-page axe remains enabled.                                                                   | Fixed                                                        |
| Blocker  | R-4: Firefox crashed resolving the dialog title reference after the closed-state axe scan.                          | `00474b3`: explicit aria-label retains the same localized name/visible heading. All 48 required matrix cases pass.                         | Fixed for required sequence; supplemental tooling note below |
| Medium   | R-5: architecture still described an absent Phase 1 UI.                                                             | `442c8ed`: lifecycle, controls, focus, CSP, styling decisions and limits.                                                                  | Fixed                                                        |
| Medium   | R-6: final geometry, isolation, zoom, spacing, semantic and performance evidence was missing.                       | `3beec98`, `f5617fb`, `38725bb`, `1d8757d`: browser audits plus raw evidence in this report commit.                                        | Completed                                                    |
| Low      | R-7: lifecycle test file is 257 lines against the 250-line soft limit.                                              | Source modules remain small (maximum 213 lines); the cohesive teardown tests are retained together.                                        | Accepted soft-limit exception                                |
| Medium   | R-8: WebKit dark ButtonFace/ButtonText are translucent too.                                                         | `28158a1`: opaque Canvas/CanvasText pairs and inverted state badges; light/dark launcher and complete matrix checks.                       | Fixed                                                        |
| High     | R-9: lazy CSSOM serialization recreated an empty root style attribute in Chromium/WebKit.                           | `45d7ab0`: serialize before removing an originally absent style attribute; ten-cycle three-engine regression.                              | Fixed                                                        |
| Medium   | R-10: internal header appeared as a document banner in the dialog's semantic tree.                                  | `8badcbe`: generic wrapper; actual tree and headed tests verify no banner.                                                                 | Fixed                                                        |
| Medium   | R-11: combining full axe instrumentation and Playwright semantic/name traversal can crash Firefox on the same page. | `f5617fb`, `2a04b64`: independent fresh-page audit passes, retaining every axe rule and browser/profile; no production control is removed. | Mitigated tooling limitation; upstream cause unresolved      |
| Medium   | R-12: an adjacent host outline could overlap the launcher without its control box intersecting.                     | `12a0419`: include outward computed outlines with a six-pixel minimum; unit and all-engine regressions.                                    | Fixed                                                        |
| High     | R-13: focusable SVG controls were excluded by the HTML-only overlap guard.                                          | `a01c537`: check every Element; unit and all-engine SVG focus regressions.                                                                 | Fixed                                                        |
| High     | R-14: after pointer input, Alt+A could focus Close without activating :focus-visible in Chromium/WebKit.            | `e11ff75`: style every focused widget control; three-engine headed regression verifies solid, contrasting rings and focus return.          | Fixed                                                        |

Self-review against sections 2, 7 and 9 found no additional Blocker/High findings after the fixes. The report records the tooling limitation rather than asserting that its underlying browser/tool defect has been repaired.

## Audits

### Accessibility (evidence)

[Raw media measurements](assets/phase-2/media-matrix.json), [headed keyboard traces](assets/phase-2/keyboard-evidence.json), and per-engine audit JSON/semantic Markdown files are committed alongside [Chromium desktop](assets/phase-2/chromium-desktop.png), [Chromium 320px](assets/phase-2/chromium-320.png), Firefox and WebKit screenshots. Screenshots were inspected; at 320px the title wraps and controls below the initial scrollport remain reachable vertically.

| Palette / component                                | Measured minimum                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Targets                                            | **24×24 CSS px** native radio inputs inside rows at least 44px high; buttons at least 44px; launcher **48×48px**. |
| Light text (default controls)                      | **7.5558:1**.                                                                                                     |
| Light focus / launcher icon                        | **7.3210:1**, with a **3px solid outline** and 3px offset.                                                        |
| Light component boundaries                         | **4.0852:1**.                                                                                                     |
| Dark text (default controls)                       | **10.3864:1**.                                                                                                    |
| Active dark-state text (including disabled glyphs) | **7.8679:1**.                                                                                                     |
| Dark focus / icon                                  | **9.9400:1**.                                                                                                     |
| Dark component boundaries                          | **6.4900:1**.                                                                                                     |
| Forced-colour text/focus/icon/boundaries           | Minimum across engines **16.6712:1** (WebKit dark); Chromium/Firefox system pair **21:1**.                        |

Native radio appearance remains platform controlled; reported boundary ratios are the enclosing radio rows and custom button/panel boundaries, not an invented measurement of internal native-radio pixels. Contrast comparisons use rendered computed colours against opaque UI surfaces.

At 320×256 the panel bounds were **x=8–312, y=8–184 (304×176)**, scrollWidth=clientWidth=302, scrollHeight=1047 and clientHeight=174 in the normal profile. At desktop 1280×900 the panel was **360×640**. No horizontal panel/document overflow was found. All four anchors with custom offsets/zIndex pass in both directions in all engines. All keyboard targets keep at least **6px clearance** from each panel edge as they scroll into view, including user text-spacing and explicit doubled UI fonts (Close 16→32px, title 20→40px). Text-box scroll dimensions show no clipping in those profiles.

The 320 CSS-pixel reflow viewport models a 1280px desktop at 400% zoom. A separate Chromium mobile CDP probe also measured VisualViewport scale **4**, width **320**, height **256**, with panel bounds inside it. Desktop toolbar zoom and Firefox/WebKit native pinch gestures were not driven by these tools; human checks remain for those browser interfaces.

Focus rings apply to every focused widget control, including programmatic entry after pointer input; they do not depend on browser :focus-visible modality heuristics.

**Headed keyboard walk:** in Chromium, Firefox and WebKit, Alt+physical KeyA opens and focuses Close. Tab visits Decrease, Increase, the native radio group's selected option, Dark mode, Focus highlight and Reset all. Enter increases to 110 and 120 percent; native arrows change radio selection; Space toggles controls and resets. Visible status text matches each change. Tab leaves for host content without a trap, closing the panel. Escape returns focus to the launcher. Focusing an overlapping host corner target closes the panel and hides the launcher while that target remains focused. Adjacent outward outlines and focused SVG controls are also protected. WebKit on macOS uses native Option+Tab for full control navigation. The committed traces record observed focus destinations.

No dedicated browser-tool capability is exposed in this environment. These walks used real headed Playwright browsers through the execution tool, not a claim of a separate unavailable tool. No manual screen-reader speech test is claimed.

| WCAG 2.2 criterion         | Result | Evidence                                                                                                                                                   |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1 Keyboard             | Pass   | Headed full sequence operates every renderer and reset.                                                                                                    |
| 2.1.2 No trap              | Pass   | Tab reaches host content; host destination retains focus.                                                                                                  |
| 2.1.4 Character shortcuts  | Pass   | Modifier-based physical event.code; configurable and disabled cases; composition/repeat/AltGraph unit tests.                                               |
| 2.4.3 Focus order          | Pass   | Close → steppers → native radios → toggles → reset; explicit Close/Escape returns launcher focus.                                                          |
| 2.4.7 Focus visible        | Pass   | Computed 3px solid outline and measured ≥7.3210:1 light/default contrast; system themes also pass.                                                         |
| 2.4.11 Focus not obscured  | Pass   | Small-height focus sweeps retain ring clearance; external HTML/SVG focus closes the panel and a launcher intersecting its bounds or outward outline hides. |
| 2.5.8 Target size          | Pass   | Real minimum 24×24, larger labelled rows and 44px buttons.                                                                                                 |
| 2.5.3 Label in name        | Pass   | Visible Increase/Decrease/Close/Reset/toggle text is included in accessible names; radios have native labels.                                              |
| 2.5.7 Dragging             | n/a    | No dragging interaction.                                                                                                                                   |
| 1.1.1 Non-text content     | Pass   | Original SVG is aria-hidden and non-focusable; no remote icon resource.                                                                                    |
| 1.3.1 Relationships        | Pass   | Named dialog/sections, headings, feature groups, descriptions, labelled radio inputs.                                                                      |
| 1.4.1 Use of colour        | Pass   | On/Off text, numeric values and pressed/checked semantics convey state.                                                                                    |
| 1.4.3 Text contrast        | Pass   | Computed ratios above and zero axe violations in every required profile and active-state audit.                                                            |
| 1.4.11 Non-text contrast   | Pass   | Focus/icon and button/panel/radio-row boundaries measured above 3:1.                                                                                       |
| 1.4.4 Text resize          | Pass   | Explicit 200% UI font override retains unclipped text and keyboard access; zoom/reflow emulation also passes.                                              |
| 1.4.10 Reflow              | Pass   | All-engine 320×256 profiles have no horizontal overflow; Chromium supplemental 400% visual-viewport probe passes.                                          |
| 1.4.12 Text spacing        | Pass   | 1.5 line height, .12em letters, .16em words and 2em paragraph spacing preserve text and control access at 320px.                                           |
| 1.4.13 Hover/focus content | n/a    | No tooltips or hover-only extra content.                                                                                                                   |
| 4.1.2 Name/role/value      | Pass   | Named explicitly non-modal dialog, expanded/controls, pressed/checked states, labelled native radios; semantic trees committed.                            |
| 4.1.3 Status messages      | Pass   | Polite atomic region receives exact change/reset text; actual spoken delivery remains a human check.                                                       |

The table describes the tested UI and patterns, not a claim that the widget makes a host site WCAG compliant. Reduced motion has no UI animation/transition; dark, forced colours and RTL are exercised.

**Semantic-tree review:** no unnamed interactive control or unintended banner remains. Radio groups expose their feature context; stepper values are described and changes announced; the dialog is non-modal. Possible verbosity to check with a screen reader: headings followed by the same feature name on its group/control, native radio labels also appearing as text leaves, and the prescribed launcher name “Open accessibility options” while expanded. Empty production groups are intentional until features arrive.

Human checks: NVDA with Firefox/Chrome and VoiceOver with Safari for dialog entry/exit, status speech/coalescing, range boundary announcements, radio context, focus return, RTL reading order and magnification. Automated role trees cannot establish spoken output.

### Security and privacy

- No runtime dependencies, new dev dependencies, package/lockfile changes or CI changes. Existing dev dependencies retain their existing build/lint/unit/browser/axe/size/package-validation roles; Prettier also formats opt-in audit artifacts. No new unused dependency or exception was introduced.
- Both audit modes report **0 vulnerabilities**. Dependency versions are unchanged from the audited foundation; no new version selection was made in this phase.
- Source scans for network APIs, cookies, unsafe HTML/JS APIs and storage found only the existing guarded localStorage adapter. UI text uses DOM construction/textContent; positions interpolate validated numeric values into owned CSS. No new storage key or open-state persistence was added.
- Browser audits recorded **zero runtime requests** after fixture bootstrap; production-bundle runtime tests also pass with strict CSP. Vite fixture boot/HMR is development infrastructure, not shipped runtime code.
- Listener counting, observer disconnect, announcer timer cancellation and exact teardown remain tested. The browser repeated-cycle regression verifies the serializer fix rather than normalizing away empty attributes.
- CSP uses constructed sheets when available or nonce-bearing style elements. Both paths pass existing browser CSP tests with the integrated UI. No per-element page styles were added by the UI; root variables remain the managed page-effect mechanism.
- CI least-privilege permissions, metadata, MIT license/author and ignored generated directories remain unchanged. No secret was read/echoed, no force push/history rewrite or publication command was used.

### Performance and size (numbers)

| Output                |      Bytes |
| --------------------- | ---------: |
| ESM                   |     29,957 |
| CJS                   |     30,430 |
| IIFE                  |     30,455 |
| IIFE gzip             | **11,024** |
| Each declaration file |      3,786 |

The gzip bundle is **5,585 bytes larger** than the Phase 1 report baseline of 5,439, and remains below the unchanged **30,000-byte warning / 35,000-byte hard limit**. No generated dist files are committed.

Final headed ten-init samples: Chromium **1.2–1.7ms**, Firefox **1–3ms**, WebKit **1–2ms**. Every measured maximum is under 50ms. Exact host content bounds stay unchanged through opening/closing, and DOM restoration is true in every engine. Chromium measured **CLS 0**; Firefox/WebKit do not expose the tested layout-shift entry type, so their raw results correctly record null, alongside unchanged host bounds. These observations are limited to the fixtures and this machine.

## Known limitations (honest)

- Real catalogue features and their interactions are future work; the shipped panel currently has empty groups. UI tests use test-only metadata/effects.
- Page filters must target content while excluding `[data-accessiblit-host]`, as documented in architecture. A root-filter prototype changed UI pixels in Firefox even in the top layer. The chosen content-only prototype preserved UI pixels in all engines; root typography and author CSS zoom isolation also pass. Future colour features must obey this contract and document content/filter stacking limits.
- Fixed fallback can be affected by ancestor clipping/transforms/filters; later site top-layer dialogs may cover native surfaces. Native top-layer order takes precedence over ordinary zIndex. Arbitrary host styles aimed at the mount, hostile mutations, extensions and embedding contexts cannot be universally repaired.
- Firefox's combined axe/Playwright semantic traversal issue remains a documented audit-tool limitation. Independent audit pages pass every required check; the underlying cause has not been established or claimed fixed.
- Destroy while a widget control is focused removes it; it does not restore an arbitrary earlier host focus destination. Explicit Close/Escape behavior is separately verified.
- Actual assistive-technology speech, desktop toolbar zoom and native mobile gestures beyond the recorded emulation need human review. This is not a conformance certification for every host site.

## Deviations from the prompt (and why)

- Initial three-attempt stop followed AGENTS.md section 11. Work resumed only after the human's explicit authorization; no incomplete tag was created then.
- The requested dedicated browser tool was unavailable. Actual headed browser input, role trees, screenshots and computed measurements were collected through Playwright execution instead.
- UI/page isolation is a documented content-filter contract, not a promise to undo arbitrary root filters in Firefox. No runtime UI adjustment or quality gate was hidden to make an impossible root-filter prototype pass.
- The only skipped tests are additional CDP calls unsupported by Firefox/WebKit; all required profiles run. No axe rule or coverage/size/lint gate was weakened.
- Public section 5 init/destroy/option/instance shapes remain intact. Messages gained UI wording and partial feature overrides; metadata gained optional value labels/units. React remains for its later phase.

## Handoff notes for the next phase

Phase 3 can register content features through the existing metadata renderers without editing UI. Use the owned page stylesheet and html classes/variables; return cleanup and register any additional resource immediately. Preserve the serializer regression, early preference application and no-network contract. Test real content effects against UI pixel/geometry isolation, especially root zoom, inherited text styles and future content filters. Respect fallback/CSP limits, retain all browser gates, and run the manual screen-reader checks above before a public release.

## Phase commit list

The report/evidence update is the final separate `docs(report)` commit; preceding commits from `git log --oneline --reverse phase-1-complete..HEAD` are:

```text
ad16395 feat(messages): define UI copy and registry control presentation
48a07c3 feat(controls): share metadata labels values and safe DOM construction
1f2ab25 feat(toggle): render labelled pressed-state controls from metadata
bd92476 feat(stepper): render bounded labelled increase and decrease buttons
ba40742 feat(radios): render native labelled option groups from metadata
5fc4ef9 feat(launcher): add the named button and decorative inline SVG
15ad8f1 feat(panel): generate the non-modal dialog from registry controls
a9d4338 feat(keyboard): match configurable shortcuts by physical code
6f54194 feat(placement): constrain all four anchors to the visible viewport
7a1bfa8 feat(layer): use non-modal top-layer surfaces with a safe fallback
236ee10 style(panel): add responsive shadow tokens and system appearance
2f3db34 feat(ui): coordinate non-modal focus shortcuts and viewport geometry
386551c feat(lifecycle): connect panel state controls and change announcements
d484a70 test(fixtures): add a panel catalogue and host focus targets
267d928 fix(focus): preserve pointer activation during transient focus loss
d05261d test(panel): cover keyboard lifecycle semantics changes and reset
e2964ed fix(launcher): use opaque forced-colour system surfaces
179db08 fix(fixtures): honour forced colours on the host page
6b17090 test(a11y): expose the browser media and contrast matrix
601a34a docs(report): record the blocked Phase 2 UI audit
00474b3 fix(panel): name the dialog without a title reference
28158a1 fix(styles): pair opaque system colours in every forced theme
3beec98 test(layout): audit anchors reflow focus and UI isolation
442c8ed docs(architecture): explain UI lifecycle isolation and limits
45d7ab0 fix(styles): flush serialization before removing root attributes
8badcbe fix(panel): avoid a document banner inside the dialog
f5617fb test(audit): record lifecycle states and semantic evidence
38725bb test(contrast): measure component boundaries in every media profile
1d8757d test(reflow): verify doubled UI text without clipping
2a04b64 docs(audit): document independent Firefox tooling passes
12a0419 fix(focus): protect outward host outlines beside the launcher
a01c537 fix(focus): protect focused SVG host controls too
e11ff75 fix(focus): show rings independently of input modality
602c145 docs(report): record completed Phase 2 verification and evidence
```
