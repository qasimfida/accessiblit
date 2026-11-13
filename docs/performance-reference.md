# Performance reference

## Maintainer Mac init gate

AGENTS.md section 8 now defines the absolute init gate on the maintainer's Mac. Connect AC power, close other apps, then run `PERF_CONDITIONS_CONFIRMED=1 npm run perf`. The confirmation records the human-controlled condition; the script independently checks AC power and refuses an invalid reference run. It never closes applications or changes power settings. The maintainer explicitly authorized keeping other apps open for this run: `npm run perf -- --other-apps-open` records `otherAppsClosed: false` and the exception, while still requiring AC power. This user instruction overrides only that run condition; the 50 ms gate and sampling method are unchanged.

The script builds and loads the real IIFE in headless Chromium and WebKit on a local intercepted origin. The fixed host contains a heading and 5,000 paragraphs. Default options exercise all eighteen registered features with empty persistent state and a closed panel. Each engine discards five warm-ups and records thirty measured runs. Only `performance.now()` immediately around `init()` contributes to the sample; browser startup, host construction, script loading, frame settling and destroy are excluded. Cleanup and a mounted host are checked outside each interval. The median is the mean of the middle pair; p95 uses nearest rank. Both engine medians must be at or below 50 ms; p95 is reported, not substituted for the median gate.

`reports/perf-macos.json` records model, chip, RAM, macOS, Node/browser versions, power/confirmation, source revision, all warm-ups, all measured samples, median and p95. `npm run test:perf` guards the exact run count, timer boundary, statistics and inclusive 50% regression boundary with independent-clock tests. These tests also run in `verify`.

The reference run on Mac15,6 / M3 Pro / 18 GiB / macOS 26.5.2 passed: Chromium median 1.8999998569488525 ms and p95 2.700000047683716 ms; WebKit median 2 ms and p95 4 ms. Raw data and the explicit open-apps condition are in [perf-macos.json](../reports/perf-macos.json). No runtime optimization was required.

Shared runners cannot establish the absolute reference result. CI runs the same script on `macos-26` for Node 20/22, reports absolute durations and fails if either engine's median exceeds 1.5 times its committed CI baseline. Exactly 50% growth passes; any greater growth fails. The guard also rejects a different platform, architecture, model, CPU count or Node major. Functional tests, axe, coverage and size remain mandatory. Earlier absolute timing probes keep their original samples and thresholds; their shared-runner outcomes are reported separately. Local legacy assertions remain unchanged.

The bootstrap run [da4f8da](https://github.com/qasimfida/accessiblit/actions/runs/43521451587) captured five warm-ups and thirty measurements per engine on VirtualMac2,1 / virtual M1 / three CPUs. Baselines [Node 20](../reports/perf-ci-node20-baseline.json) and [Node 22](../reports/perf-ci-node22-baseline.json) contain raw data and job provenance. Their Chromium/WebKit medians are 1.5/3 ms and 1.75/5 ms respectively. Baseline capture had no timing verdict; it is not a regression pass. CI now uses `--ci --baseline reports/perf-ci-node<major>-baseline.json`; the workflow never captures or updates a baseline automatically. Review a baseline change with its machine, source and samples; never refresh it merely to silence a regression.

## Historical content-toggle investigation

The following preserves the earlier 100 ms content-toggle investigation. It measures a different operation and includes a following frame callback; it is not the new synchronous-init reference method. Earlier failures remain failures in their raw receipts.

Desktop WebKit CI uses `macos-26`, the standard three-CPU Apple Silicon runner documented by [GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). iPhone QA retains ARM coverage through `macos-latest`. A trial of the standard four-CPU Intel runner (`macos-26-intel`) failed all seven timing cases on both Node versions and exceeded the 20-minute job timeout. Commit ec4fa39 restores the original Apple Silicon platform with an explicit OS label; this rollback does not turn any failed timing result into a pass.

The reference protocol is unchanged:

- Node 20 and 22, with one Playwright worker and zero retries.
- The original seven desktop timing cases run in a fresh browser process, followed by every remaining case. A failed timing step continues to fail the job.
- Each case has exactly 5,000 host elements, enforced by the shared probe. Two frame callbacks settle fixture/prior-render work before each stopwatch starts; that baseline wait is reported separately. Every original setting value and sample remains measured.
- Both synchronous work and elapsed time to the next animation-frame callback must be strictly below 100 ms. Exactly 100 ms fails.
- Every timing/control probe retains API and source traces. Screenshot and DOM-snapshot observers are disabled in those files; functional UI checks retain visual tracing. Coverage, axe rules, init and size limits are unchanged. Frame callback timing is not a final-pixel-paint measurement.

The complete matrix has 1,208 cases in 47 files per Node version: 21 timing cases across the three desktop engines and 1,187 remaining cases, with no omissions or overlap. Phone projects retain their 100 QA cases each.

Native CSS controls use simpler selectors and force a geometry read; they are comparison diagnostics, not strict numeric lower bounds on the frame-callback metric. They never replace a feature gate. Current controls share settled baselines and API-only trace settings; earlier cold-first-row receipts retain their original provenance. Raw native and engine samples, including failures on the earlier three-vCPU virtual M1, are preserved under reports/assets/phase-7. Selector, typed-variable and browser-mode prototypes were not adopted. R-21 corrects the benchmark setup by settling the host between operations; independent-clock unit guards keep each API call and its following callback inside the measured interval and reject wrong workloads. Earlier manual tracing comparisons were inconclusive; R-20 now isolates visual recording in Playwright Test while preserving API/source evidence. The local audit checks 33 trace archives for retained calls/sources and zero visual records.

The historical trace and baseline protocol still failed on Apple Silicon: Node 20 run 43489145056 records five failed cases, including a 639 ms next-frame sample; its remaining 325 functional cases pass with four capability skips. The maintainer subsequently defined the synchronous-init method above in AGENTS.md section 8; the new result must not relabel these old frame-callback failures as passes. Do not rotate runner labels until one happens to pass. No claim is made for arbitrary host CPU load, other hardware or physical mobile devices.
