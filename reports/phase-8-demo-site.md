# Phase 8 — Demo and documentation site

Status: BLOCKED (CI regression guard and Pages deployment)
Date: 2026-11-14. Commit range: `phase-7-complete..HEAD`; completion tag withheld until deployment is verified.

## Summary

Built an original, static TypeScript/Vite documentation site under `/accessiblit/`, with the real local IIFE widget, five authored pages, local artwork and search metadata. No runtime dependency or library API changed. Local checks and deployment receipts are recorded below; publishing the npm package remains a human-only action. The audited site is pushed at `8ba3e50`. Phase 7 remains completed at its passing reference/CI tag; the later Phase 8 CI run has a newly observed regression-guard failure and is not claimed as passing.

## What changed (files and why)

- `site/`: home and all 18 feature descriptions; installation, options, FAQ/privacy and custom 404 pages; responsive light/dark/system-colour styles; local social artwork, favicon, robots and sitemap. Static HTML keeps the content available without JavaScript. The homepage is 254 lines of authored content, slightly above the soft module guideline; logic modules remain small.
- `scripts/build-site.mjs` and `scripts/site/serve.mjs`: copy the actual local library build, compile an early classic bootstrap and serve the production output at the repository base, including real 404 responses and traversal protection.
- `e2e/site/` and `playwright.site.config.ts`: independent five-project site matrix; all pages, seven media/layout profiles, keyboard flow, table scrolling, links, metadata, first-party requests and persisted first-frame settings.
- `scripts/test-site-snippets.mjs`: extract the actual eleven marked documentation snippets, install a packed tarball, compile TypeScript consumers and run six browser integrations per engine. No symlink to source.
- `.github/workflows/pages.yml`: audited build and Pages deployment with pinned official actions; write permissions only in the deployment job. CI also runs the site suite and packed consumers independently.
- `scripts/audit-site.mjs`: optional, pinned Lighthouse 13.6.0 through an ephemeral development tool installation, without a new root or runtime dependency.

## Verification (commands run, real results)

- `npm run verify`: PASS, 184 Vitest tests in 58 files and six benchmark self-tests; lint, strict types, coverage, library build, plain-Node SSR checks, size, publint and attw. Core line/branch coverage 98.63%/97.96%; overall lines/branches 96.12%/90.71%.
- `npm run test:site`: initial **215 passed (3.7 minutes)** across all five projects, zero retries or skips. The final matrix includes 175 page/media cases with both closed/open axe scans (350 scans, zero violations), five keyboard journeys, five link checks, five request audits, five first-frame persistence tests, ten LTR/RTL table tests, plus metadata and routing checks. [Raw local receipt](assets/phase-8/local-verification.json) preserves all emitted measurements, axe incomplete identifiers, request URLs, snippet results and output weights. Each browser checked 23 unique internal links across ten destinations with zero broken links.
- After R-7, the expanded `npm run test:site` suite passed **220 tests (3.6 minutes)**, zero retries/skips. It adds five deterministic streamed-parser cases; all 350 closed/open axe scans still report zero violations. [Complete corrected-run measurements](assets/phase-8/parser-correction-verification.json) retain every emitted result, including empty-frame counts.
- `npm run test:site-snippets`: PASS. Eleven snippets extracted; Node16 and Bundler consumer type checks; five shell syntax checks; eighteen browser integrations across Chromium, Firefox and WebKit. Development React StrictMode created and removed two hosts for both React examples in every engine.
- Headed browser keyboard walk: five passed (11.5 seconds). Skip link → main → live-demo button → panel close control → font-size increase → reset → Escape and launcher focus → backward Tab to header → installation/options/FAQ/home navigation. Native keyboard input, no scripted focus or retry. Separately, ten headed LTR/RTL table tests passed (9.8 seconds): plain arrows scroll 64 CSS pixels, reverse restores position, Tab exits and a 3px focus ring remains visible.
- Persisted first-frame tests: five passed (7 seconds). After setting font size to 120%, all five first sampled animation frames after reload measured 19.2px rather than the 16px default. This is sampled rendering evidence, not a claim about every physical display paint.
- `npm run audit:site`: five raw Lighthouse reports retained in [assets/phase-8/lighthouse](assets/phase-8/lighthouse/). All pages: accessibility 100, best practices 100, performance 100. Four content pages: SEO 100. The 404 scores SEO 63 solely because its deliberate `noindex` prevents crawling; it is excluded from the sitemap.
- `actionlint`: PASS. `npm audit` and `npm audit --omit=dev`: zero vulnerabilities. The ephemeral Lighthouse tool's installed dependency audit also reported zero.
- Runtime Playwright discovery remains 1,208 cases; the dedicated site suite is excluded only from the root configuration and has its own mandatory CI job.

### Post-push checks

[CI run 43533062360](https://github.com/qasimfida/accessiblit/actions/runs/43533062360) passed both Node 20/22 verification/example jobs. Node 20 init trend passed: Chromium median/p95 1.50/2.90ms, WebKit 2.00/5.00ms. Node 22 Chromium **failed** the unchanged 50% regression guard: median 2.7000000000116415ms, p95 6.399999999994179ms, baseline median 1.75ms, limit 2.625ms (54.29% increase). WebKit passed at 2.00/4.00ms. [Raw samples and conditions](assets/phase-8/ci-init-trend.json) are retained. `git diff phase-7-complete -- src tsup.config.ts package-lock.json scripts/perf.mjs scripts/perf` is empty. The cause of the shared-runner difference is **not established**; unchanged source does not turn a failed guard into a pass. No baseline/threshold was changed and no retry was requested.

The [Pages run](https://github.com/qasimfida/accessiblit/actions/runs/43533062370) is recorded separately from the existing native [Jekyll build](https://github.com/qasimfida/accessiblit/actions/runs/43533060781). The public home returned HTTP 200 with title `Accessiblit | accessiblit`, without the new hero or widget script: this is the old site, not proof of Vite deployment. A request to the maintainer to select the GitHub Actions publishing source is pending. Both initial site runs stopped with 214 passes and one iPhone persistence-probe failure (16px versus 19.2px); deployment/source-check steps were not reached. R-7 below addresses the reproduced parser-shell false-positive path; the original failure is retained, not relabelled as a pass.

## Review findings and fixes

| Severity | Finding                                                                               | Fix                                                                                                                              | Status                                  |
| -------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Low      | R-1: initial stylesheet exceeded the small-module guideline                           | `f90041a`: preserve cascade order while separating layout, components and media rules                                            | Fixed                                   |
| Low      | R-2: “10-point” font scaling description had ambiguous units                          | `58bf916`: specify ten percentage points                                                                                         | Fixed                                   |
| High     | R-3: WebKit did not natively arrow-scroll the focused overflowing options table       | `30127ef`: handle unmodified horizontal arrows only on the focused region; ten LTR/RTL browser guards preserve Tab and modifiers | Fixed                                   |
| Low      | R-4: keyboard harness assumed identical forward wrap after a main fragment in Firefox | `740006b`: use the observed native backward Tab path to the header; five headed flows pass                                       | Fixed                                   |
| Medium   | R-7: first-frame probe counted empty parser shells as text                            | `cd21fe5`: retain strict nonempty-text size checks and add five streamed-parser guards                                           | Fixed; 220 local tests pass, CI pending |
| Blocker  | R-5: Node 22 Chromium exceeded the unchanged CI regression guard                      | `0ceb33e`: preserve raw failure; cause not established, no threshold/baseline change                                             | Open                                    |
| Blocker  | R-6: Vite Pages deployment not verified                                               | Administrator source selection requested; initial runs stopped before deployment                                                 | Open                                    |

R-7 (Medium, test harness): the first-frame probe sampled a paragraph shell before the HTML parser supplied its text. A two-chunk WebKit reproduction observed 38 empty 16px frames, then only 19.2px frames with text. `cd21fe5` changes the probe to sample the first five **nonempty text** frames at the same required size and records empty-frame counts. A deterministic streamed-parser test asserts the empty shell is 16px with no text samples, releases text, and requires all five text frames to be 19.2px. Ten targeted tests passed in 8.4 seconds across all five projects. The initial CI log recorded only size, not text presence, so it cannot retrospectively prove which parser state it sampled. No runtime source changed.

The source findings above are fixed. Two release blockers remain: R-5, the unexplained Node 22 shared-runner regression-guard failure; R-6, Vite Pages deployment has not been verified and repository source configuration needs the administrator. Generated site output alone is ignored by ESLint; source lint and all accessibility rules remain enabled. No runtime threshold, coverage gate or axe rule was weakened.

## Audits

### Accessibility

Five authored pages are audited closed and with the real panel open, in light, dark, forced-colours, reduced motion, RTL, 320×256 and WCAG text-spacing profiles on Chromium, Firefox, WebKit, emulated iPhone and Pixel. Axe violations must be zero in each state. The raw receipt preserves axe incomplete results; `color-contrast` can be incomplete for off-screen/obscured content, so computed solid-background contrast and keyboard checks supplement axe rather than treating incomplete checks as passes.

The site has one h1, a main landmark, named navigation, a skip link, logical headings, visible underlined links, native controls and no tabs or focus trap. Minimum measured authored text contrast was 6.240363:1, panel text 6.820450:1. The smallest measured site navigation/button/skip target was 43.1875 CSS pixels under text-spacing overrides (normally 44); widget controls were at least 24. Inline prose links use the inline-text target exception. Focus rings are 3px. Screenshots are preserved under [assets/phase-8/screenshots](assets/phase-8/screenshots/).

A browser automation agent performed the keyboard journeys; no human screen-reader session or physical mobile-device test was performed. The existing [manual screen-reader script](../docs/manual-screen-reader-test.md) remains for human execution. Automated results do not establish universal WCAG conformance.

### Security and privacy

No runtime dependencies added, no lockfile changes, and no cookies, tracking, external fonts or remote images. All page and demo requests are recorded by browser tests; feature interaction adds no request. Only the existing `accessiblit:v1` localStorage key is used, inside the existing guarded storage adapter. No unsafe DOM API or network feature was introduced. Public npm/CDN examples explicitly say the package is not published; the CDN consumer test intercepts the documented URL with tarball bytes and does not claim public CDN availability. Private-registry/Git commands receive syntax checks only; no credentials or private infrastructure were used.

All 21 existing development dependencies retain their established roles: ESLint/typescript-eslint/@eslint/js, Prettier, TypeScript/@types/node, tsup, Vite, Vitest/coverage/jsdom, Playwright/axe, size-limit/file, publint/attw, and React/ReactDOM plus their types for optional-entry consumer tests. Lighthouse is optional development tooling, not shipped code. No secret value was read or printed. Workflows refer to token names only, with `contents: read` by default; only Pages deploy receives `pages: write` and `id-token: write`.

### Performance and size

The library IIFE remains 57,849 bytes raw and 19,603 bytes gzip, unchanged from Phase 7 and below 35KB. React is not bundled into the site's widget. Lighthouse's default simulated mobile run measured:

| Page    | FCP / LCP (ms) | TBT (ms) | CLS | Reported page bytes |
| ------- | -------------- | -------- | --- | ------------------- |
| Home    | 1353.43        | 0        | 0   | 80,721              |
| Install | 1353.24        | 0        | 0   | 78,917              |
| Options | 1370.56        | 3        | 0   | 78,104              |
| FAQ     | 1352.53        | 0        | 0   | 76,528              |
| 404     | 1351.79        | 0        | 0   | 73,336              |

These are local one-run simulated measurements, not physical-device/network guarantees. Phase 7's committed maintainer-Mac benchmark remains Chromium median/p95 1.90/2.70ms and WebKit 2.00/4.00ms; no runtime source changed in this phase.

## Known limitations (honest)

- Screen readers and physical devices are not verified. Shadow DOM/iframe/canvas and font limitations documented on the site still apply.
- npm 0.0.0 is not published. Installation snippets are real API examples tested against a tarball; public npm/CDN availability requires a separate human release.
- The Next.js snippet demonstrates and browser-tests the client-component lifecycle; a new private registry or deployment of an example Next app was not performed.
- The deliberate non-indexable 404 does not score 100 for SEO.

## Deviations from the prompt (and why)

No heavy framework or interactive tabs were added; a clear installation list avoids an unnecessary composite keyboard pattern. Original SVG artwork was rendered locally to PNG. The no-network rule applies to widget runtime: loading the static site's own documents/assets is necessarily first-party HTTP and is recorded separately. Optional Lighthouse needs Node 22.19+; it does not change the library's Node 20 support.

## Handoff notes for the next phase

Deployment is not yet claimed. After the audited push, inspect the Pages run and live URL, then record the actual outcome here. If repository Pages uses legacy branch publishing, a repository administrator must select **Settings → Pages → Build and deployment → Source: GitHub Actions**; the workflow token cannot change repository administration settings. No completion tag is created until the deployment requirement is resolved. The project base and Actions source follow the [official Vite Pages instructions](https://vite.dev/guide/static-deploy.html#github-pages); [configure-pages](https://github.com/actions/configure-pages) documents the additional administration authority needed to enable Pages automatically.

The human should then check the home/install/options/FAQ pages at `https://qasimfida.github.io/accessiblit/`, the live demo's keyboard controls, the real custom 404, and the Network panel for first-party requests only. Public npm publishing remains outside this phase.

## Phase commit list

```text
7a31d00 build(site): add the Vite project-site foundation
e722c96 style(site): add responsive theme tokens and visible focus
9e4d616 docs(site): add the original homepage and live-demo guidance
b08c121 docs(site): describe all eighteen registered features
e8b3162 docs(site): add public and private installation methods
b0b8352 docs(site): document the real options and lifecycle API
568c616 docs(site): explain privacy and the limits of personalisation
f449e99 docs(site): add a helpful accessible not-found page
79f5051 docs(site): add local social artwork and search metadata
0d88d39 build(site): preview the project base and custom not-found routes
f90041a refactor(site): keep layout and media styles in small modules
15fce8a test(site): verify production routes beneath the repository base
58bf916 fix(site-copy): clarify the font scaling step unit
5158c68 test(site): audit every page across media and spacing profiles
3c4a1e2 test(site): check internal links fragments and local assets
ed3afde test(site): prove first-party requests and local-only settings
1d90e02 test(site): validate catalogue options and search metadata
740006b test(site): walk the demo and documentation using native keys
30127ef fix(site): support keyboard scrolling in the options table
c0d3a16 test(site): prove persisted preferences restore in the head bootstrap
82b4ef1 test(site): run extracted install snippets from a packed tarball
54e6ef0 build(site): add a pinned Lighthouse audit without runtime dependencies
7ea5acc ci(pages): deploy the audited static site with scoped permissions
75089fb ci(site): gate production pages and packed snippets in the matrix
50651a1 docs(audit): preserve the five Lighthouse reports and indexing note
dee4e71 docs(audit): preserve desktop and narrow site screenshots
94b6642 docs(audit): record the final site matrix and packed consumers
8ba3e50 docs(report): record phase eight checks before deployment
0ceb33e docs(audit): preserve the unchanged CI regression guard failure
cd21fe5 fix(site-tests): sample text after parser shells receive content
cdce82e docs(audit): preserve the parser probe failure and reproduction
296ca1f docs(audit): record the expanded site matrix after probe correction
```
