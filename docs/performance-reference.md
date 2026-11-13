# Performance reference

Desktop WebKit CI uses `macos-26`, the standard three-CPU Apple Silicon runner documented by [GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). iPhone QA retains ARM coverage through `macos-latest`. A trial of the standard four-CPU Intel runner (`macos-26-intel`) failed all seven timing cases on both Node versions and exceeded the 20-minute job timeout. Commit ec4fa39 restores the original Apple Silicon platform with an explicit OS label; this rollback does not turn any failed timing result into a pass.

The reference protocol is unchanged:

- Node 20 and 22, with one Playwright worker and zero retries.
- The original seven desktop timing cases run in a fresh browser process, followed by every remaining case. A failed timing step continues to fail the job.
- Each case has exactly 5,000 host elements, enforced by the shared probe. Two frame callbacks settle fixture/prior-render work before each stopwatch starts; that baseline wait is reported separately. Every original setting value and sample remains measured.
- Both synchronous work and elapsed time to the next animation-frame callback must be strictly below 100 ms. Exactly 100 ms fails.
- Every timing/control probe retains API and source traces. Screenshot and DOM-snapshot observers are disabled in those files; functional UI checks retain visual tracing. Coverage, axe rules, init and size limits are unchanged. Frame callback timing is not a final-pixel-paint measurement.

The complete matrix has 1,208 cases in 47 files per Node version: 21 timing cases across the three desktop engines and 1,187 remaining cases, with no omissions or overlap. Phone projects retain their 100 QA cases each.

Native CSS controls use simpler selectors and force a geometry read; they are comparison diagnostics, not strict numeric lower bounds on the frame-callback metric. They never replace a feature gate. Current controls share settled baselines and API-only trace settings; earlier cold-first-row receipts retain their original provenance. Raw native and engine samples, including failures on the earlier three-vCPU virtual M1, are preserved under reports/assets/phase-7. Selector, typed-variable and browser-mode prototypes were not adopted. R-21 corrects the benchmark setup by settling the host between operations; independent-clock unit guards keep each API call and its following callback inside the measured interval and reject wrong workloads. Earlier manual tracing comparisons were inconclusive; R-20 now isolates visual recording in Playwright Test while preserving API/source evidence. The local audit checks 33 trace archives for retained calls/sources and zero visual records.

The current reference must pass CI before Phase 7 can be tagged. The corrected trace and baseline protocol still fails on Apple Silicon: Node 20 run 43489145056 records five failed cases, including a 639 ms next-frame sample; its remaining 325 functional cases pass with four capability skips. After three unsuccessful approaches, further benchmark-platform changes await explicit clarification under AGENTS.md section 11. If it fails, preserve the failure and investigate or report the blocker; do not rotate runner labels until one happens to pass. No claim is made for arbitrary host CPU load, other hardware or physical mobile devices.
