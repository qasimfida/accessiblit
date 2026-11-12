# Phase 2 — Accessible launcher and panel

Status: BLOCKED
Date: 2026-11-12. Local range: `phase-1-complete` (`7a0b8ee`) to this report commit. No `phase-2-complete` tag or Phase 2 push.

## Summary

The launcher, non-modal panel, registry-driven controls, keyboard handling and change announcements are implemented. The full media accessibility matrix is blocked by a repeatable Firefox page crash after the closed-state axe scan and opening the panel. Work stopped under section 11 after the initial matrix, an in-page axe attempt and a tracing-disabled attempt did not resolve that acceptance failure. This is not a completed Phase 2 and must not be tagged complete.

At phase start, AGENTS.md was read completely, main was clean, `git pull --ff-only` succeeded and `phase-1-complete` existed. Node v24.13.0, npm 11.6.2, git 2.50.1 were used. All implementation commits were made directly on main with lint, typecheck and relevant unit tests before each commit. No history was rewritten.

## What changed (files and why)

- `src/ui/launcher.ts`: original decorative inline SVG and named 48×48 button with expanded/controls state.
- `src/ui/panel.ts`: named, explicitly non-modal dialog, introduction, three named groups, close and reset buttons. The registry generates every control.
- `src/ui/{toggle,stepper,radios,presentation,control-types}.ts`: visible labels/descriptions, pressed state, bounded steppers, native radio semantics and metadata-derived value announcements.
- `src/ui/{controller,keyboard,placement,layer,styles}.ts`: physical-code shortcuts, focus return, ordinary Tab order, native manual popovers, focus visibility, viewport geometry, logical CSS, dark/reduced-motion/system-colour styles and owned resource cleanup.
- `src/core/{types,options,lifecycle}.ts`: UI copy, optional range units/select labels and label/description overrides, lifecycle actions, queued opening before body is ready, state updates and polite announcements. The section 5 option and instance shapes remain unchanged; Messages gains UI strings, and feature label/description maps accept partial overrides.
- `tests/ui/`, core/API tests and `tests/helpers/panel-features.ts`: unit coverage and a development-only catalogue covering every renderer.
- `fixtures/panel.html`, `e2e/panel.spec.ts`, `e2e/launcher-colors.spec.ts`, `e2e/panel-a11y.spec.ts`, `e2e/helpers/ui-evidence.ts`: host focus targets, browser interaction tests and an uncompromised computed-size/contrast/axe matrix. No axe rules are excluded.

Production feature implementations remain for later phases. Its three groups show an empty-state message until features are registered internally; the test catalogue is not imported by the package entry. There are no misleading no-op production controls.

### Local phase commit list

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
```

This document is committed separately as `docs(report): record the blocked Phase 2 UI audit`.

## Verification (commands run, real results)

- `npm run verify`: PASS after the implementation and the forced-colour fixes. 23 unit files, **107 tests passed**. All-source coverage **98.42% lines (875/889), 96.50% branches (469/486)**. Core coverage **98.83% lines, 98.08% branches**. UI coverage **97.84% lines, 93.64% branches**. Existing thresholds were not lowered.
- Build: minified ESM **29.14 KB**, CJS **29.61 KB**, IIFE **29.63 KB**, declaration files **3.70 KB** each, plus source maps. The plain Node ESM/CJS SSR check passed with browser-global access guarded.
- `npm run size`: **10,975 bytes gzip**, below warning 30,000 and limit 35,000.
- `npm run check:package`: publint “All good”; Are The Types Wrong “No problems found”.
- `npm audit` and `npm audit --omit=dev`: both **0 vulnerabilities**. No package.json/lockfile changes or added dependencies in this phase.
- `npm run test:e2e -- e2e/panel.spec.ts`: **12 passed** across Chromium, Firefox and WebKit after R-1. Covers pointer opening/closing, physical-code/default/custom/disabled shortcuts, Escape focus return, native radio arrows, steppers, toggles, announcements, reset, tab exit without a trap and host-focus overlap handling.
- `npm run test:e2e -- e2e/launcher-colors.spec.ts --workers=1`: **3 passed** after R-2.
- Earlier existing runtime suite: **21 passed** after lifecycle integration. It has not been rerun as a complete final suite after the audit changes; no final all-e2e pass is claimed.
- Initial 48-case panel matrix: **16 passed, 32 failed**. Chromium/WebKit non-forced light/dark profiles passed. Failures revealed forced-colour surface/fixture issues and Firefox crashes. Following fixes, individual Chromium desktop light and dark forced-colour cases each passed with **0 axe violations closed and open**. The complete matrix has not passed or been rerun after those fixes.
- Firefox reproduction: `npm run test:e2e -- --project=firefox --grep 'desktop light forced=none motion=no-preference' --workers=1` fails while waiting for the opened dialog with **“Page crashed”**. Browser debug output reports a content process exiting on **signal 11**. Using axe's in-page legacy execution did not resolve it; disabling Playwright tracing did not resolve it. The unsuccessful legacy change was removed, leaving the original full scanner. A separate concurrent diagnostic encountered a stopped dev server; that connection error is not counted as evidence of a UI defect.
- Direct Firefox opening with and without media emulation worked in a standalone probe. A direct in-page axe probe without the runner's full setup also worked. Therefore the precise cause is **unresolved**; this report does not assume a Firefox, axe or library defect without isolation.

## Review findings and fixes

| Severity | Finding                                                                                                          | Fix                                                                                                                             | Status                     |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Medium   | R-1: Safari can transiently clear focus before a pointer click; closing on that blur cancels control activation. | `267d928`: defer closing to actual external focus; unit regression plus all-engine keyboard/pointer suite.                      | Fixed                      |
| Medium   | R-2: forced-colour Highlight can be translucent, making launcher icon contrast depend on the page backdrop.      | `e2964ed`: opaque ButtonFace/ButtonText system pairing; three-engine regression.                                                | Fixed                      |
| Medium   | R-3: the host fixture's authored colours conflicted with forced dark backgrounds during whole-page axe scans.    | `179db08`: explicit Canvas/CanvasText/LinkText/ButtonFace/ButtonText fixture rules; Chromium light/dark forced cases passed.    | Fixed; full matrix pending |
| Blocker  | R-4: Firefox crashes in the required closed/open media scan sequence.                                            | No browser is skipped and no assertion is disabled. Regression retained in `6b17090`; stop after three unsuccessful approaches. | Open                       |
| Medium   | R-5: architecture documentation still describes Phase 1's absent UI.                                             | Interim design and limitations recorded below; dedicated architecture update remains required after resuming.                   | Open because work stopped  |
| Medium   | R-6: final zoom/isolation/RTL/spacing/CLS/performance and complete semantic-tree audit evidence is missing.      | Do not claim unmeasured acceptance checks pass.                                                                                 | Open because work stopped  |

Self-review found no runtime network calls, unsafe HTML insertion or new storage path in the added source. UI source modules are 18–206 lines. The expanded lifecycle test file slightly exceeds the 250-line soft limit; split it during resumed maintenance.

## Audits

### Accessibility (evidence)

Observed passing profile measurements from Chromium/WebKit:

| Profile                                                   | Minimum target dimension                                             | Minimum text contrast | Focus outline  | Focus/icon contrast |
| --------------------------------------------------------- | -------------------------------------------------------------------- | --------------------- | -------------- | ------------------- |
| Light                                                     | **24 px** native radio input; buttons at least 44 px; launcher 48 px | **7.5558:1**          | **3 px solid** | **7.3210:1**        |
| Dark                                                      | **24 px**                                                            | **10.3864:1**         | **3 px solid** | **9.9400:1**        |
| Forced colours, corrected Chromium light/dark spot checks | **24 px**                                                            | **21:1**              | **3 px solid** | **21:1**            |

Measured desktop panel bounds were x=904–1264, y=188–828 (360×640). At 320×256 they were x=8–312, y=8–184 (304×176), with scrollWidth=clientWidth=302, scrollHeight=1047 and clientHeight=174: vertical scrolling without horizontal overflow. These numbers establish tested profiles only, not the unresolved all-browser matrix.

The keyboard sequence exercised actual Playwright browser input: Alt+physical KeyA → Close focus → Tab to Decrease/Increase → activate twice → native radio arrow changes → toggle dark mode and focus highlight → Reset all → tab outside → external focus remains usable; Escape returns focus to the launcher. Focus on an overlapping host corner target closes the panel and hides the launcher until safe. No dedicated browser-tool capability is exposed in this session, and a separate interactive human-style browser walkthrough was not completed. Playwright evidence does not substitute for a manual screen-reader check.

The following table uses PASS only for implemented behavior with evidence. FAIL includes required evidence still missing; it is not a conformance certification.

| WCAG 2.2 criterion           | Result | Evidence / remaining check                                                                                   |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| 2.1.1 Keyboard               | Pass   | Twelve three-engine interaction cases operate all renderer kinds and reset.                                  |
| 2.1.2 No keyboard trap       | Pass   | Tab leaves shadow UI; external host focus is retained.                                                       |
| 2.1.4 Character shortcuts    | Pass   | Modifier-based event.code matching; default/custom/disabled tests.                                           |
| 2.4.3 Focus order            | Pass   | Close, range buttons, native radios, toggles, reset; Escape returns launcher focus.                          |
| 2.4.7 Focus visible          | Pass   | Computed 3 px solid focus ring and measured contrast in successful profiles.                                 |
| 2.4.11 Focus not obscured    | Fail   | Host overlap behavior tested; full small-height scrolling/zoom focus sweep remains pending.                  |
| 2.5.8 Target size            | Pass   | Computed minimum 24×24 in successful matrix profiles; radio label rows and buttons at least 44 high.         |
| 2.5.3 Label in name          | Pass   | Visible control labels, Close/Reset/Increase/Decrease names and labelled native radios.                      |
| 2.5.7 Dragging movements     | n/a    | No dragging interaction.                                                                                     |
| 1.1.1 Non-text content       | Pass   | Decorative original SVG is aria-hidden and non-focusable.                                                    |
| 1.3.1 Info and relationships | Pass   | Named dialog, headings/group sections, descriptions, labelled radiogroups and native inputs tested.          |
| 1.4.1 Use of colour          | Pass   | On/Off text, visible numeric values and aria-pressed/checked convey state.                                   |
| 1.4.3 Text contrast          | Fail   | Passing measured ratios above; complete forced-colour Firefox/WebKit acceptance matrix outstanding.          |
| 1.4.11 Non-text contrast     | Fail   | Passing measured focus/icon ratios above; complete system-colour matrix and all boundaries pending.          |
| 1.4.4 Resize text            | Fail   | CSS uses fixed local typography with responsive geometry; explicit 200% text resizing evidence pending.      |
| 1.4.10 Reflow                | Fail   | 320×256 successful profiles have no horizontal overflow; actual 400% zoom audit pending.                     |
| 1.4.12 Text spacing          | Fail   | Dedicated user-overridden spacing audit not completed.                                                       |
| 1.4.13 Hover/focus content   | n/a    | No tooltips or hover-triggered extra content.                                                                |
| 4.1.2 Name, role, value      | Pass   | Behavioral tests assert named non-modal dialog, expanded/controls, pressed/checked states and radio changes. |
| 4.1.3 Status messages        | Pass   | Polite atomic status region text follows value changes/reset; assistive-technology speech remains manual.    |

Semantic intent is a named launcher and dialog, nested group headings, individually named/described feature groups, native radios and explicit button names. A complete captured accessibility tree audit was not finished. Potential confusion to inspect with a screen reader: repeated feature heading/control names, value text plus descriptions on steppers, and empty groups before real features arrive. Human checks remain for NVDA/Firefox or Chrome, VoiceOver/Safari, speech timing/coalescing, radio group announcements, focus return and the native popover layer.

Reduced-motion, dark and forced-colour CSS are implemented. Light/dark plus reduced-motion non-forced Chromium/WebKit profiles passed; full matrix is blocked. RTL placement has unit coverage, but complete visual browser RTL evidence remains pending. Zero CLS and no overlap at every zoom level are **not yet confirmed** for this phase.

### Security and privacy

- No runtime dependencies added; package/lockfile unchanged from Phase 1. Existing dev dependencies keep their existing build/lint/unit/browser/axe/size/package-validation roles. No new dependency or dependency exception to justify.
- Both audit modes return zero vulnerabilities. A fresh-install/Node 20/22 compatibility run has not been repeated for this blocked phase.
- Source scan for fetch, XMLHttpRequest, sendBeacon, WebSocket, innerHTML, outerHTML, document.write, eval, Function construction, cookie and storage APIs found only the existing guarded localStorage adapter. No new storage key, network API, cookie, secret handling or unsafe DOM API was introduced.
- UI text is created with DOM nodes/textContent. Numeric positions are finite resolved values in an owned sheet. Public text/options do not become dynamic HTML.
- Lifecycle/controller unit tests retain listener counting, observer disconnect, teardown, idempotent init and SSR coverage. A whole final browser residue/network audit was not repeated after the last fixes.
- CI permissions and dependency files are unchanged. No secrets were read or echoed. No publish commands were run.

### Performance and size (numbers)

The current production IIFE is **10,975 bytes gzip**, 31.36% of the 35,000-byte limit. Raw tsup outputs and coverage numbers are recorded above. No Phase 2 initialization-time distribution, runtime network trace or complete open/close CLS measurement was collected before stopping. These remain required, rather than being inferred from Phase 1 results.

## Known limitations (honest)

- R-4 blocks the required all-browser axe matrix and therefore phase acceptance. All three engines pass the committed interaction suite, but that does not prove the accessibility scan sequence is sound.
- Manual top-layer popovers escape page ancestor filters/transforms and inherited root typography is reset locally. Author CSS zoom still affects their boxes, so the controller compensates measured launcher scaling through its owned stylesheet. This decision requires the pending cross-browser isolation/zoom tests before claiming success. Browser zoom should remain usable rather than being counteracted.
- With native popovers unavailable or failing, fixed-position fallback can be affected by ancestor transforms, clipping or filters. Later top-layer site dialogs can cover the widget. Host CSS targeting the mount itself, hostile DOM mutations and browser extensions cannot be universally isolated.
- `zIndex` is applied to the surfaces, but native top-layer ordering takes precedence over ordinary page stacking contexts.
- The UI uses constructed shadow stylesheets where available and nonce-bearing style-element fallback otherwise, through the existing sheet manager. It makes no network request to repair a denied CSP. Existing fallback tests do not constitute a final Phase 2 CSP audit in every UI state.
- Closing due to host focus intentionally preserves the user's host destination; explicit Close/Escape returns to the launcher. The floating panel may visually cover unfocused content while open. Focus overlap handling and final zoom-level evidence are distinct checks.
- No real feature effects, React entry, complete docs site or production feature catalogue is added in this phase.

## Deviations from the prompt (and why)

- Section 11's mandatory stop after three unsuccessful attempts took precedence over finishing remaining audits, pushing and tagging. Fast gates pass; the required browser criterion does not. No completion tag was created.
- No dedicated browser tool is available. Real Playwright browser keyboard interactions were run, but the requested separate interactive walkthrough is incomplete and not represented as passed.
- No quality threshold, browser project or axe rule was weakened. Failed experimental scanner/tracing changes were not retained.
- Public init/destroy/instance option contracts remain unchanged. Metadata and UI messages were extended for generic renderer labels/value formatting.

## Handoff notes for the next phase

Resume **Phase 2**, not Phase 3. First isolate R-4 with the committed Firefox reproduction. Compare native popovers, constructed styles, media emulation, axe's mutations and the test context separately; the cause is not established. Keep Firefox and every axe rule enabled. After resolving it, rerun all 48 matrix profiles plus interaction/runtime tests, complete zoom/RTL/text-spacing/isolation/semantic/manual keyboard/CLS/performance/CSP audits, update architecture documentation and this report, and address review findings with one commit per finding and pre-commit fast checks. Only after full verify and all required e2e checks pass should main and an annotated `phase-2-complete` tag be pushed.
