# Phase 7 — QA hardening

Status: BLOCKED

Date: 2026-11-13. Range: `phase-6-complete` (`a47a551`) to local main. No phase-7 completion tag or push.

## Summary

Phase 7 stopped under AGENTS.md section 11: “If an acceptance criterion still fails after three honest attempts, stop and report the blocker. Do not paper over it.” The strict nonce-fallback audit still produces CSP console errors on Chromium and Pixel emulation after three approaches. The pre-audit widget checks and axe violation assertions pass, but the required error-free tested state does not.

Preflight: AGENTS.md was read completely. Main was clean, git pull --ff-only returned already up to date, and phase-6-complete resolved to a47a551682109f4bcc016a62fd0ac4b353b59533. Constants contain no placeholders. Observed tools: Node 24.13.0, npm 11.6.2, git 2.50.1. Work remains on main in granular local commits.

The remote main remains at Phase 6. Known-failing QA guards are preserved locally for diagnosis; they have not been pushed into remote main. There is no claim that the phase or CI acceptance criteria pass.

## What changed (files and why)

- playwright.config.ts adds iPhone 13/WebKit and Pixel 7/Chromium emulation for qa-prefixed suites, retaining three desktop engines. Automatic retries are zero everywhere, including CI.
- fixtures/qa provides plain, shadow-component, same-origin and opaque iframe, strict CSP, 5,500-paragraph, high-z-index CSS dialog and CSS-reset hosts. Shared boot code uses the built ESM entry and opt-in in-memory change records; persistence is disabled.
- e2e/helpers/qa.ts delivers raw fixture HTML, avoiding development websocket injection under strict CSP. Five profiles cover standard, forced colours, reduced motion, dark scheme and RTL. Widget audits retain all axe rules; iframe traversal is excluded because the widget scope contains no iframe, and host-frame content is outside the claimed audit scope.
- qa-boundaries.spec.ts proves unchanged frame font size under parent font adjustment and observes the sandbox's opaque origin from inside the frame through privileged test automation. It avoids a denied parent-side document probe that WebKit logs as an error.
- qa-csp.spec.ts preserves the failing nonce-fallback case. It checks actual page font styling and zero errors before auditing, then checks axe, geometry and zero errors after auditing. No CSP errors are filtered.
- qa-hosts.spec.ts defines 200 all-eighteen-at-maximum host/profile/project cases. Only a partial matrix has completed; see exact counts below.
- reports/assets/phase-7/blocked-evidence.json preserves successful geometry measurements and the failing diagnostics.

No library runtime source, dependencies, lockfile, public API or package delivery metadata changed.

## Verification (commands run, real results)

| Command / run                              | Result                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run verify                             | PASS: lint, format, strict typecheck, 169 unit tests, build, Node SSR check, size, publint and attw                                           |
| Coverage                                   | Global 95.93% lines / 90.08% branches; core 98.63% lines / 97.96% branches                                                                    |
| First Chromium qa-hosts run                | 30 passed, 10 failed in 55.1 seconds; failures were iframe fixture resources and nonce-fallback audit diagnostics                             |
| Final qa-boundaries run, all five projects | 5 passed, 0 failed in 12.2 seconds                                                                                                            |
| Partial qa-hosts matrix                    | 99 passed, 5 failed, 1 interrupted, 95 did not run in 2.7 minutes; intentionally stopped after the known CSP issue repeated                   |
| Final qa-csp run, all five projects        | 8 passed, 2 failed in 18.2 seconds; failures are Chromium and Pixel nonce-fallback cases                                                      |
| CSP pre-audit checks                       | All ten cases apply font size 200% as computed 32px and have no recorded console/page errors before audit                                     |
| CSP widget axe/geometry checks             | Closed/open axe assertions report zero violations in all ten cases (20 scans); geometry assertions also pass before the final error assertion |
| npm audit, npm audit --omit=dev            | Zero vulnerabilities in each                                                                                                                  |
| Test collection                            | 908 scheduled cases in 41 files, not a claim that they were all executed                                                                      |

Counts above are per invocation, not cumulative distinct tests. There were no automatic retries. The partial host matrix's interruption and unrun cases are not counted as passes or skips. The full legacy regression, full new matrix and cloud CI were not completed in this phase. No new instrumentation skips were added.

After the stopping condition, only closure verification, evidence preservation and this report were performed. No fourth CSP repair attempt was made.

## Review findings and fixes

| Severity | Finding                                                                                                                             | Fix / guard                                                                                                                                                             | Status                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Blocker  | R-2: nonce-fallback audit emits CSP style diagnostics on Chromium and Pixel despite passing pre-audit checks                        | qa-csp.spec.ts preserves the failure with unchanged policy, axe rules and console-error assertion; three approaches below                                               | Unresolved; phase stopped |
| Low      | R-1: opaque iframe attempted a loopback stylesheet request; a parent-side negative security probe itself caused a WebKit diagnostic | d2d5018: self-contained static frame styles and inside-frame origin observation. qa-boundaries.spec.ts passes all five projects, font remains 16px and errors are empty | Fixed                     |

R-2 attempts:

1. Force fallback installation with replaceSync unavailable and supply the matching nonce. The first host run still records six CSP errors during closed/open audits.
2. Verify all installed fallback styles carry the nonce, then restore the main page's native API before axe's probes. The matrix still fails in the Chromium nonce cases.
3. Limit the fallback override to the actual CSP fixture URL, leaving auxiliary audit documents alone. The targeted ten-case CSP run still fails on Chromium and Pixel.

The final failing assertion is after auditQA, not the earlier runtime error check. The six messages contain three repeated SHA-256 style hashes, two audit passes. That timing suggests an audit-time path, but attribution to axe, cloned shadow styles, deferred widget work or another mechanism is not proved. No production defect is asserted without that attribution. Existing traces under ignored test-results retain detailed local diagnostics; the committed evidence includes the error messages without third-party trace source dumps.

No policy relaxation, inline-style hash exception, console filtering, axe rule disabling or retries were used to make the failure disappear. Scoping the widget audit away from host iframe contents is explicit; host iframe accessibility is not certified.

## Audits

### Accessibility

Successful sampled states have at least 24px targets, no horizontal widget overflow, and measured text/boundary contrast meeting the existing assertions (4.5:1 and 3:1). Captured standard-profile minima include 6.8204499469:1 text and 3.6876381329:1 boundaries; forced colours records 21:1. The data is linked in blocked-evidence.json. These are partial sampled-state results, not an AA conformance claim.

All five iframe cases pass closed/open widget axe scans and preserve frame text sizing. All ten targeted CSP cases pass closed/open widget axe assertions, but two fail the console-error gate afterward. The partial host run also contains successful forced-colour, reduced-motion, dark and RTL samples. It does not establish complete device/host/profile coverage.

The required full keyboard-only flow and headed keyboard audit were not executed this phase. Screen-reader output was not tested. No claim is made about real iPhone/Pixel hardware, NVDA, VoiceOver, TalkBack, speech control, physical keyboards attached to phones, native HTML modal-dialog inertness or arbitrary host shadow/iframe content. The CSS high-z-index dialog fixture is not a native showModal test.

### Security and privacy

Runtime src is unchanged; no new runtime request, cookie, analytics, storage key or unsafe DOM API was introduced. The fixture callback collects only feature changes in memory and persistence is disabled. The opaque frame boundary remains intact: allow-same-origin was not added. Its stylesheet is now static inline fixture text, avoiding an opaque-origin loopback request. No secrets or environment files were read or committed.

Dependencies and package metadata are unchanged; both npm audits are clean. Existing .gitignore continues to cover node_modules, dist, coverage, test-results and .env*. Generated build/test output remains uncommitted. Only selected report evidence is committed.

### CSP findings and owner policy

The tested policy is:

```text
default-src 'none'; script-src 'self'; style-src 'self' 'nonce-qa-owner'; style-src-attr 'none'; img-src data:; frame-src 'self'; connect-src 'none'; base-uri 'none'; object-src 'none'
```

qa-owner is a public test value, not a production nonce. Site owners should use a fresh response nonce, supply it through options.nonce for style-element fallback, and authorize their own loader/module URLs. Modern constructed stylesheets pass the tested non-nonce path. CSS property updates successfully apply the page adjustment under style-src-attr none. Data images permit the documented embedded cursor assets; the widget makes no font request.

Do not add unsafe-inline or authorize the diagnostic hashes as a workaround for this unresolved audit path. The fallback audit cannot yet be certified error-free on Chromium/Pixel. The helper proves nonce-bearing installation before restoring native APIs for the audit tool; the fixture policy itself never changes.

### Performance and size

This session's build reports IIFE gzip 19,444 bytes, below the 30,000 warning and 35,000 cap. Performance, heap, 200-init/destroy trend and attributable layout-shift measurements were not implemented or run in this phase. Earlier phase numbers are not reused as current evidence. Consequently the no-growth-trend acceptance criterion remains unproved.

## Known limitations (honest)

- The zero-console-error gate fails for the nonce-fallback audit on Chromium and Pixel.
- The full 908-case collection has not run; the complete CI matrix is not proved.
- Pairwise feature coverage, a complete keyboard flow and 200-loop lifecycle/leak tests are unfinished.
- docs/ACCESSIBILITY.md and docs/manual-screen-reader-test.md were not produced before the mandatory stop; they must not be treated as completed conformance deliverables.
- All phone runs are emulation, and all browser runs in this phase were headless. No screen reader or physical device was used.
- Host shadow internals, remote frame content, native modal-dialog inertness and operating-system accessibility behaviour remain unverified.

## Deviations from the prompt (and why)

Phase implementation stopped after the third unsuccessful CSP approach as explicitly required by AGENTS.md section 11. Completing the remaining tasks, claiming PASS, pushing failing QA to remote main or creating phase-7-complete would overstate the result. Local reproducer and report commits preserve concrete, reviewable work while remote main remains the Phase 6 rollback point.

## Handoff notes for the next phase

Start with the two failing cases:

```sh
npm run build
npx playwright test e2e/qa-csp.spec.ts --project=chromium --project=pixel --workers=1
```

Inspect the three diagnostic hashes against the installed shadow styles and axe's temporary documents to attribute the audit-time errors. Keep the policy and error assertions intact. Resume the remaining Phase 7 tasks only after the blocker is understood; then execute the full closing protocol and publish the completion tag only when all gates pass.

## Local phase commit list

```text
4500b46 docs(audit): preserve blocked CSP and partial matrix evidence
cf0184f test(hosts): capture maximum-feature QA coverage across profiles
7c6a688 test(csp): preserve the blocked nonce-fallback audit case
d2d5018 fix(fixtures): make opaque-frame checks self-contained
685ba0d test(fixtures): add isolated, heavy and hostile QA host pages
de1a0f1 test(matrix): add phone profiles and disable automatic retries

```

This report is the separate `docs(report): record blocked phase seven audit` commit. Use `git log --oneline phase-6-complete..HEAD` for the complete local list.
