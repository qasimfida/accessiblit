# Human screen-reader test

Status: **Not run**. Browser automation cannot verify spoken output, virtual-cursor navigation or real-device behaviour. Complete this script before making an accessibility conformance claim. Record failures as defects rather than filling the table from automated results.

## Set up

1. Record the commit, OS, browser, screen-reader versions, device, language and date. Build with `npm ci && npm run build`, then start `npm run dev -- --port 4173` and open `/qa/plain.html`. This fixture disables persistence; use the HTML consumer example separately to test saved preferences.
2. Test each combination below with its normal screen-reader settings. On macOS enable full keyboard navigation. On iOS and Android use swipe exploration and double-tap activation, then test an external keyboard if available. Do not treat phone emulation as a real-device result.
3. Repeat the main flow in dark appearance, reduced motion, Windows forced colours where available, portrait and landscape, and at the largest practical browser zoom/text size. Include `/qa/shadow.html`, `/qa/iframes.html`, `/qa/modal.html` and the owner's real page. The widget does not enter or remediate frame or third-party shadow content.

## Main flow

| Step | Action                                                                                                                        | Expected observation / what to record                                                                                                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Read the page and locate the launcher by buttons, then by sequential navigation.                                              | One button named “Open accessibility options”; collapsed state; no SVG announced as a separate image. Host reading order remains useful.                                                                                               |
| 2    | Activate the launcher. Also try Alt+A on desktop.                                                                             | Named non-modal “Accessibility options” dialog opens. Close receives focus. Expanded state changes; no duplicate dialog. Record whether the screen reader announces the dialog context.                                                |
| 3    | Read the panel without activating controls.                                                                                   | Three named groups, visible feature labels and descriptions. Value text and unavailable stepper actions are understandable. Record redundant or missing speech.                                                                        |
| 4    | Use Tab/Shift+Tab through every control. On touch, swipe through them.                                                        | Logical order, no trap, no hidden focus. Radio groups use arrow keys; toggles announce pressed state; steppers announce their action and current value. At a range boundary the unavailable button retains focus and reports disabled. |
| 5    | Increase font size twice from 100 to 120. Change every other feature once, using only the reader/keyboard.                    | Each change announces its feature and new value once after the update. Speech is not cut off or duplicated. Radio changes do not unexpectedly move focus. Record actual speech, including units.                                       |
| 6    | Turn on all 18 features, using maximum settings where relevant. Scroll through the panel and back to the host page.           | Panel remains readable and controls operable. Focus and reading order do not jump. Reading overlays follow focus without blocking activation. Touch-only cursor note is understandable.                                                |
| 7    | Leave the panel with Tab, Shift+Tab or reader navigation; return to it. Focus host controls near the sticky header and panel. | Non-modal access to the page remains possible. Focus is visible and not covered by the widget. Record any host modal/top-layer conflict separately.                                                                                    |
| 8    | Activate “Reset all”.                                                                                                         | Default values/states return; “All options reset.” is announced without moving focus away from reset.                                                                                                                                  |
| 9    | Press Escape on desktop, or activate Close on touch. Reopen and close again.                                                  | Panel disappears; launcher receives focus on close; collapsed state is accurate. No invisible panel controls remain in the reading sequence.                                                                                           |
| 10   | On the persistent consumer integration, save settings and reload. Mount/unmount the React example twice.                      | Saved values and announced control states agree. One launcher after remount; no stale dialog or duplicate announcements.                                                                                                               |
| 11   | Repeat with an owner translation and an RTL host if supported by the integration.                                             | Pronunciation, names, descriptions, units and navigation direction remain clear. Report language/translation gaps instead of assuming English testing covers them.                                                                     |

## Results for the human to fill in

Leave “Not run” until a person executes the flow. Attach notes with the step number, expected and actual speech, and a reproducible host page; avoid recordings containing personal information.

| Screen reader / browser / OS | Device and versions | Date / tester | Steps and actual speech | Result / defects / evidence |
| ---------------------------- | ------------------- | ------------- | ----------------------- | --------------------------- |
| NVDA + Firefox / Windows     | Not recorded        | Not run       | Not run                 | Not run                     |
| NVDA + Chrome / Windows      | Not recorded        | Not run       | Not run                 | Not run                     |
| VoiceOver + Safari / macOS   | Not recorded        | Not run       | Not run                 | Not run                     |
| VoiceOver + Safari / iOS     | Not recorded        | Not run       | Not run                 | Not run                     |
| TalkBack + Chrome / Android  | Not recorded        | Not run       | Not run                 | Not run                     |

Use Pass, Fail or Blocked per step, explain every blocked step, and link fixed defects to their regression tests. An automated axe pass does not replace these results. See [the widget evidence scope](ACCESSIBILITY.md) and [Phase 7 report](../reports/phase-7-qa-hardening.md).
