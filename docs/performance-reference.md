# Performance reference

Desktop WebKit CI is pinned to `macos-26-intel`: the standard four-CPU, 14-GB runner documented by [GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). The public repository can use this standard label without a custom runner. iPhone QA retains ARM coverage through `macos-latest`. Earlier virtual-M1 failures remain recorded; this choice does not turn them into passes.

The reference protocol is unchanged:

- Node 20 and 22, with one Playwright worker and zero retries.
- The original seven desktop timing cases run in a fresh browser process, followed by every remaining case. A failed timing step continues to fail the job.
- Each case has 5,000 host nodes. Every original setting value and sample remains measured.
- Both synchronous work and elapsed time to the next animation-frame callback must be strictly below 100 ms. Exactly 100 ms fails.
- Every timing/control probe retains API and source traces. Screenshot and DOM-snapshot observers are disabled in those files; functional UI checks retain visual tracing. Coverage, axe rules, init and size limits are unchanged. Frame callback timing is not a final-pixel-paint measurement.

The complete matrix has 1,208 cases in 47 files per Node version: 21 timing cases across the three desktop engines and 1,187 remaining cases, with no omissions or overlap. Phone projects retain their 100 QA cases each.

Native CSS controls are diagnostic lower bounds with simpler selectors; they never replace a feature gate. Raw native and engine samples, including failures on the earlier three-vCPU virtual M1, are preserved under reports/assets/phase-7. Selector, typed-variable, settling and browser-mode prototypes were not adopted. Earlier manual tracing comparisons were inconclusive; R-20 now isolates visual recording in Playwright Test while preserving API/source evidence. The local audit checks 33 trace archives for retained calls/sources and zero visual records.

The pinned reference must pass CI before Phase 7 can be tagged. If it fails, preserve the failure and investigate or report the blocker; do not rotate runner labels until one happens to pass. No claim is made for arbitrary host CPU load, other hardware or physical mobile devices.
