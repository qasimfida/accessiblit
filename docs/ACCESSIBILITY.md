# Widget accessibility evidence

Status: **Phase 7 verification in progress**. This is a scoped engineering report, not a WCAG conformance certification. The widget personalises presentation; it does not make a host site compliant. The [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) defines the criteria; this table covers its 55 A/AA criteria. Obsolete 4.1.1 is excluded.

“Pass” means the stated check passed on the tested fixtures and browser builds. It does not establish support in every assistive technology or host page. “Pending run” requires the final run linked in the [Phase 7 report](../reports/phase-7-qa-hardening.md). “Not verified” requires a human. “N/A” describes absent widget functionality, not the host site's obligations.

## Evidence and scope

- [Host matrix](../e2e/qa-hosts.spec.ts): eight hosts, five profiles, three desktop engines and two emulated phones; all eighteen features at maximum. Closed/open axe audits are scoped to the widget, retain every rule and exclude traversal of unrelated host frames.
- [Combinations](../e2e/qa-combinations.spec.ts): eighteen individual maxima and 32 binary off/maximum rows covering every feature pair's four assignments. Intermediate-level combinations and every possible permutation are not claimed.
- [Keyboard](../e2e/qa-keyboard.spec.ts): actual browser keyboard events change every feature, audit each changed state, reset, close, return focus and leave the panel. Phone keyboard cases model an external keyboard, not touch screen-reader gestures.
- [Small viewport](../e2e/panel-layout.spec.ts) and [media/axe states](../e2e/panel-a11y.spec.ts): 320×256 CSS pixels, user text size/spacing, dark, forced colours and reduced motion. Chromium separately exercises visual-viewport pinch zoom. These do not replace manual browser-menu zoom on every OS.
- [Semantics](../e2e/panel-audit.spec.ts), [lifecycle](../e2e/qa-lifecycle.spec.ts), [heap](../e2e/qa-heap.spec.ts), [CSP](../e2e/qa-csp.spec.ts) and [isolation boundaries](../e2e/qa-boundaries.spec.ts) provide regression evidence, not spoken-output testing.
- [Human screen-reader script and empty results](manual-screen-reader-test.md): NVDA/Windows, VoiceOver/macOS+iOS and TalkBack/Android remain **Not run**.

## WCAG 2.2 A/AA matrix

| Criterion | Level | Result       | Method and evidence / practical limit                                                                                                                    |
| --------- | ----- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1     | A     | Pending run  | Axe and semantic tree: decorative SVG hidden, launcher and controls have text names.                                                                     |
| 1.2.1     | A     | N/A          | Widget has no recorded audio or video. Host media remains the owner's responsibility.                                                                    |
| 1.2.2     | A     | N/A          | No widget video.                                                                                                                                         |
| 1.2.3     | A     | N/A          | No widget audiovisual presentation.                                                                                                                      |
| 1.2.4     | AA    | N/A          | No live widget media.                                                                                                                                    |
| 1.2.5     | AA    | N/A          | No recorded widget video.                                                                                                                                |
| 1.3.1     | A     | Pending run  | Axe/DOM: named dialog, three labelled groups, headings, labels, descriptions and native radio groups. Spoken grouping still needs the human.             |
| 1.3.2     | A     | Pending run  | Keyboard sequence and semantic tree follow the visible group/control order; screen-reader reading sequence remains unverified.                           |
| 1.3.3     | A     | Pending run  | Visible text describes actions and values; operation does not require recognising an icon or location.                                                   |
| 1.3.4     | AA    | Not verified | No orientation lock in widget code; phone portrait is emulated. Real-device rotation remains manual.                                                     |
| 1.3.5     | AA    | N/A          | Widget requests no personal-information inputs.                                                                                                          |
| 1.4.1     | A     | Pending run  | Text, pressed/checked state, underlines and outlines carry meaning in addition to colour.                                                                |
| 1.4.2     | A     | N/A          | Widget produces no audio.                                                                                                                                |
| 1.4.3     | AA    | Pending run  | Axe plus computed foreground/background ratios in the host/profile matrix; numeric minimum belongs to the run report.                                    |
| 1.4.4     | AA    | Pending run  | Panel layout tests apply 200% user text sizing and traverse every target. Physical browser-menu zoom still needs manual confirmation.                    |
| 1.4.5     | AA    | Pending run  | Labels and values are real text, with no text baked into images.                                                                                         |
| 1.4.10    | AA    | Pending run  | 320×256 layout, vertical scrolling, keyboard visibility and no horizontal panel overflow; Chromium visual-viewport zoom probe.                           |
| 1.4.11    | AA    | Pending run  | Computed control-boundary and focus-indicator ratios; forced-colours/system-colour states included.                                                      |
| 1.4.12    | AA    | Pending run  | Small-viewport panel test imposes user line, word, letter and paragraph spacing and traverses all targets.                                               |
| 1.4.13    | AA    | N/A          | No tooltip or hover-only content; panel visibility is explicitly activated.                                                                              |
| 2.1.1     | A     | Pending run  | Full keyboard test changes all eighteen controls, resets and closes.                                                                                     |
| 2.1.2     | A     | Pending run  | Tab leaves the non-modal panel; Escape closes and returns focus.                                                                                         |
| 2.1.4     | A     | Pending run  | Alt+A is modifier-based; shortcut parsing/configuration and `false` disabling have regression tests.                                                     |
| 2.2.1     | A     | N/A          | No widget time limit.                                                                                                                                    |
| 2.2.2     | A     | Pending run  | Widget has no automatically moving informational content; navigation tests cover reduced motion and stopping host animations within documented limits.   |
| 2.3.1     | A     | Not verified | No flashing widget animation is designed; emulated motion tests are not a luminance/frequency analysis of arbitrary host pages or media.                 |
| 2.4.1     | A     | N/A          | Widget has no repeated site-navigation blocks; host bypass mechanisms remain the owner's responsibility.                                                 |
| 2.4.2     | A     | N/A          | Widget does not own the document title. Fixture titles do not demonstrate a host site's conformance.                                                     |
| 2.4.3     | A     | Pending run  | Full keyboard focus path, radio-group entry and close/reset focus assertions.                                                                            |
| 2.4.4     | A     | N/A          | Widget UI has no navigation links; highlighting host links does not repair their names.                                                                  |
| 2.4.5     | AA    | N/A          | Widget is a single settings panel, not a set of pages.                                                                                                   |
| 2.4.6     | AA    | Pending run  | Visible feature headings, labels and one-line descriptions; semantic tree checked. Human wording review remains useful.                                  |
| 2.4.7     | AA    | Pending run  | Focus ring style, width and contrast are measured; keyboard targets stay visible while the panel scrolls.                                                |
| 2.4.11    | AA    | Pending run  | Focus geometry checked inside the panel and against host controls/sticky header. Host top-layer/modal interactions outside fixtures remain a limitation. |
| 2.5.1     | A     | Pending run  | Settings use simple activation; reading overlays add optional tracking without requiring a gesture.                                                      |
| 2.5.2     | A     | Pending run  | Native buttons/radios activate through normal click semantics; no pointer-down-only setting changes.                                                     |
| 2.5.3     | A     | Pending run  | Axe/name assertions and visible labels agree; stepper names include the feature and action.                                                              |
| 2.5.4     | A     | N/A          | No motion-actuated controls.                                                                                                                             |
| 2.5.7     | AA    | Pending run  | No setting requires dragging; steppers, radios and toggles have keyboard alternatives.                                                                   |
| 2.5.8     | AA    | Pending run  | Computed interactive target boxes meet 24×24 CSS pixels; the measured minimum is reported, without claiming every control is 44×44.                      |
| 3.1.1     | A     | Not verified | Widget inherits the host language. English defaults and owner-supplied translations need language agreement and human pronunciation checks.              |
| 3.1.2     | AA    | Not verified | Owner translations do not include automatic language tagging; mixed-language integrations need manual review.                                            |
| 3.2.1     | A     | Pending run  | Moving focus alone does not change a setting or navigate the page.                                                                                       |
| 3.2.2     | A     | Pending run  | Explicit setting changes update presentation and status without navigating or submitting data.                                                           |
| 3.2.3     | AA    | N/A          | No multipage widget navigation.                                                                                                                          |
| 3.2.4     | AA    | Pending run  | Registry metadata generates consistent names and controls across hosts and remounts.                                                                     |
| 3.2.6     | A     | N/A          | No contact/help mechanism in the widget.                                                                                                                 |
| 3.3.1     | A     | N/A          | No free-text or invalid user submission; controls constrain values. Owner option diagnostics are developer output.                                       |
| 3.3.2     | A     | Pending run  | Each setting has a visible label and description; steppers expose units/current values.                                                                  |
| 3.3.3     | AA    | N/A          | No invalid user-entry workflow.                                                                                                                          |
| 3.3.4     | AA    | N/A          | No legal/financial submission or deletion of user data; reset changes only widget preferences.                                                           |
| 3.3.7     | A     | N/A          | No repeated data-entry process.                                                                                                                          |
| 3.3.8     | AA    | N/A          | No authentication.                                                                                                                                       |
| 4.1.2     | A     | Pending run  | Axe, native semantics and ARIA assertions verify names, roles and current states; unavailable stepper actions use aria-disabled.                         |
| 4.1.3     | AA    | Not verified | DOM live-region updates are automated; spoken timing, interruption, duplicates and announcement quality require the human script.                        |

## Not verified

No screen reader, physical phone, Windows forced-colours desktop, browser/OS combination outside installed test builds, speech input or switch device has been exercised by this agent. There is no claim about arbitrary CSS-in-JS pages, closed shadow roots, cross-origin frame internals, native dialogs from unrelated applications, canvas pixels or browser extensions. Host text scaling, filters, palettes and zoom have the limits documented in the ADRs.

The panel is non-modal: leaving it is expected. Frame content and other components' shadow trees remain separate presentation boundaries. A strict-CSP owner should authorise local scripts and supply its own nonce for fallback style elements; constructed sheets are used when supported. The CSP audit helper authorises only axe's detached stylesheet copies with the fixture nonce, without changing the live policy or suppressing violations.
