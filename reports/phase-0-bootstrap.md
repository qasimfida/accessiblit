# Phase 0 — Bootstrap and tooling

Status: PASS WITH NOTES
Date: 2026-11-11 (Asia/Karachi) / Commit: the commit containing this report / Branch: `phase/0-bootstrap`
Base: `3d4989c` (`main`, pulled and confirmed up to date before work).

## Summary

Bootstrapped strict TypeScript, three library formats, type declarations, unit and browser checks, package validation, a gzip size budget, and least-privilege CI. No runtime dependencies. This is a foundation, not an implemented widget.

Environment: Node `24.13.0`, npm `11.6.2`, git `2.50.1 (Apple Git-155)`. The package supports Node `^20.19.0 || >=22.13.0` for development tooling. CI selects the latest releases in the Node 20 and 22 lines.

## What changed (files and why)

- `AGENTS.md`: retain the human's existing edits to the project constants. Package name follows section 0: `@qasimfida/accessiblit`. Instructions otherwise unchanged; excluded from formatting to preserve the supplied file.
- `package.json`, `package-lock.json`: metadata, scripts, explicit ESM/CJS exports and matching declarations, development dependencies, security overrides, distributable allowlist, and side-effect-free imports.
- `tsconfig.json`, `tsup.config.ts`: strict ES2019 typing, DOM library, isolated modules, minified ESM/CJS/IIFE, source maps, declarations, global `Accessiblit`.
- ESLint, Prettier, EditorConfig, git ignore/attributes: consistent source checks and line endings; ignore dependencies, outputs, coverage, browser artifacts, and `.env*`.
- `src/index.ts`: all 18 feature IDs, real options/instance/event/message types, documented API stubs. `init` and `destroy` explicitly throw `not implemented` as permitted for this bootstrap phase.
- `tests/index.test.ts`, `vitest.config.ts`: test both stubs in jsdom; enforce 85% lines, branches, statements, and functions across all source files.
- `e2e/smoke.spec.ts`, `playwright.config.ts`, `fixtures/index.html`: Vite fixture server; Chromium, Firefox, WebKit; axe, keyboard focus, measured targets and computed colours.
- `scripts/clean.mjs`, `scripts/size-warning.mjs`: portable cleanup and 30 KB gzip warning; size-limit enforces 35 KB gzip.
- `.github/`: Node 20/22 CI, pinned action revisions, PR template, weekly npm/actions Dependabot checks.
- `LICENSE`, `README.md`, directory placeholders: MIT (2026, Qasim Fida), one-paragraph project introduction, report/script directories.

### Development dependency justification

Every direct dependency is used; none are shipped as runtime dependencies.

| Dependency            | Installed version | Purpose                                             |
| --------------------- | ----------------- | --------------------------------------------------- |
| TypeScript            | 5.9.3             | Strict typechecking and declaration generation      |
| tsup                  | 8.5.1             | ESM, CJS, IIFE, sourcemaps and declarations         |
| Vite                  | 8.3.8             | Fixture development server and Playwright webServer |
| ESLint                | 10.14.0           | Source linting                                      |
| @eslint/js            | 10.0.1            | Recommended JavaScript lint rules                   |
| typescript-eslint     | 8.72.2            | TypeScript parser and lint rules                    |
| Prettier              | 3.9.10            | Formatting and formatting gate                      |
| Vitest                | 4.1.12            | Unit runner                                         |
| @vitest/coverage-v8   | 4.1.12            | Coverage collection and thresholds                  |
| jsdom                 | 29.1.1            | DOM environment for unit tests                      |
| @types/node           | 20.19.43          | Tooling types aligned to oldest supported Node line |
| @playwright/test      | 1.65.0            | Three-engine browser runner and assertions          |
| @axe-core/playwright  | 4.13.0            | Accessibility audit in each browser                 |
| size-limit            | 12.1.0            | Gzip bundle budget gate                             |
| @size-limit/file      | 12.1.0            | File compression measurement for size-limit         |
| publint               | 0.3.25            | Packed-package metadata and export validation       |
| @arethetypeswrong/cli | 0.18.5            | ESM/CJS/bundler declaration resolution checks       |

## Verification (commands run, real results)

- `npm ci`: passed; final dependency selection audited 294 packages with 0 vulnerabilities.
- `npm run verify`: passed, including lint/format, typecheck, coverage, all builds, gzip budget and package checks. Repeated after review fixes.
- Fresh indexed source export in a temporary directory: Node `20.20.2`, `npm ci --engine-strict` and `npm run verify` passed without engine warnings. No original `node_modules` or `dist` was copied.
- Fresh indexed source export: Node `22.23.4`, `npm ci --engine-strict`, `npm run verify`, and `npm run test:e2e` passed (3/3 browsers, 5.4 seconds).
- Clean local clone of implementation commit `57341f9` (`git clone --no-hardlinks --branch phase/0-bootstrap`): on Node `20.20.2`, `npm ci --engine-strict` and `npm run verify` passed with 0 vulnerabilities. No pre-existing dependencies or generated files were copied. The subsequent report-only commit records this result.
- Unit tests: 1 file, 1 passing test. Lines/statements 100% (3/3), functions 100% (2/2); reported branches 100% (0/0). There is no meaningful runtime branching yet.
- `npx playwright install chromium firefox webkit`: completed. `npm run test:e2e`: 3/3 passed, final local run 3.7 seconds.
- `npm run check:package`: publint “All good”; Are the Types Wrong reports no problems for node10, Node16 CJS/ESM, and bundler resolutions. Those labels describe declaration resolution, not a promise to support Node 10/16.
- Plain Node imports of `dist/index.mjs`, require of `dist/index.cjs`, and IIFE execution in an empty VM context: all expose callable `init` and `destroy` without a DOM.
- `actionlint` 1.7.12: installed through Homebrew and ran successfully against CI. No manual-only YAML validation claim.
- `npm audit` and `npm audit --omit=dev`: both 0 vulnerabilities.
- `git diff --cached --check`: passed.

## Review findings and fixes

| Severity | Finding                                                                                               | Fix                                                                                                                      | Status |
| -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| Blocker  | Latest size-limit uses `node:fs/promises.glob`, unavailable on Node 20                                | Use stable size-limit/file 12.1.0; verified clean install and full gate on Node 20                                       | Fixed  |
| High     | Initial install had 11 development dependency vulnerabilities                                         | Narrow affected-version overrides for minimatch to `^11.0.1` and esbuild to `^0.28.2`; rerun lint, build and both audits | Fixed  |
| High     | Latest axe adapter declared Node >=22.12                                                              | Use 4.13.0, preserving the Node 20 CI requirement                                                                        | Fixed  |
| Medium   | TypeScript 6 breaks tsup 8 declaration builds with TS5101 (`baseUrl` injected by declaration tooling) | Retain stable TypeScript 5.9.3; no deprecation suppression or weakened type gate                                         | Fixed  |
| Medium   | Latest jsdom requires newer Node than the matrix supports                                             | Use 29.1.1, which supports Node 20.19+                                                                                   | Fixed  |
| Medium   | macOS WebKit skips form controls with ordinary Tab by default                                         | Test native Option+Tab on macOS WebKit; retain ordinary Tab on other platforms/engines and assert focus                  | Fixed  |
| Medium   | ESM/CJS declarations require separate export mappings                                                 | Add import/require `types` conditions with `.d.ts` and `.d.cts`; validate packed package                                 | Fixed  |
| Low      | Size helper console lacked ESLint global declaration                                                  | Declare read-only console for script files                                                                               | Fixed  |
| Low      | publint suggested canonical repository URL and sideEffects metadata                                   | Add `git+https` URL and `sideEffects: false`; publint now has no suggestions                                             | Fixed  |

Reviewed the complete authored diff against AGENTS sections 2, 7 and 9. No outstanding Blocker, High or Medium findings. Public exports are documented; largest authored source file is under 250 lines. Source is original.

## Audits

### Accessibility (evidence)

Axe reports **0 violations** on the complete fixture in Chromium, Firefox and WebKit. A real-browser automated keyboard-only walkthrough reaches the native button using Tab (Option+Tab on macOS WebKit) and asserts actual focus and a computed 3 px outline. No click or programmatic focus substitutes for keyboard navigation.

Computed button targets: Chromium 100.453125 × 44 px; Firefox 101.533333 × 44 px; WebKit 91.953125 × 44 px. Each exceeds 24 × 24 and meets the 44 px goal. Browser-computed text `rgb(17, 17, 17)` on `rgb(255, 255, 255)` gives 18.88:1 contrast using the sRGB luminance formula; outline uses the same dark colour on white. The fixture uses a language, title, main landmark, native heading and button.

These results apply to the fixture only. There is no widget panel or launcher yet; widget keyboard behavior, reflow, forced-colours, RTL and other state-specific checks belong to later phases. No human manual browser review is claimed.

### Security and privacy

No runtime dependencies; no network requests, storage, cookies, credentials, unsafe DOM APIs or analytics in library source. Static inspection searched source/fixtures/scripts for `eval`, `new Function`, `document.write`, `innerHTML`, fetch/XHR and storage/cookie access; no matches. Fixture Vite requests and dependency/browser downloads are development-only. No secrets or `.env` contents were read or created.

Both full and production-only npm audits report 0 vulnerabilities. Lockfile included. Security overrides change only affected transitive ranges and have passed the tooling gates. Revisit them when upstream dependencies adopt patched releases.

CI has only `contents: read`; actions are pinned to v6 commit revisions, no publishing step or secret-printing step exists. `.gitignore` covers `node_modules`, `dist`, `coverage`, `test-results`, browser reports and `.env*`. MIT text and package author/repository/bugs/homepage were reviewed against project constants.

### Performance and size (numbers)

Minified bundle bytes: ESM 163; CJS 618; IIFE 643. IIFE gzip **393 bytes**, below the 30,000-byte warning and 35,000-byte failure thresholds. Sourcemaps and both declaration files are generated separately. Representative final local build: JS 9–10 ms; declarations 398 ms. These are build timings, not widget init performance. No init-time or layout-shift claim is made for throwing stubs.

## Known limitations (honest)

- The library is a typed bootstrap stub. `init` and `destroy` throw; no widget, storage, lifecycle or real features exist. Do not deploy this version as a working widget.
- Runtime imports are SSR-safe; the Phase 1 no-op SSR init behavior is still outstanding.
- React entry and optional peer dependency are deferred until that entry is implemented; no unused React dependency was installed.
- Stable compatible tooling is used instead of absolute latest major versions where latest drops Node 20 or breaks the required tsup declaration pipeline. Tested newer TypeScript failed rather than silently suppressing its error.
- Hosted Linux GitHub Actions results are separate from local macOS checks and must be reviewed in the PR.

## Deviations from the prompt (and why)

- Added package checks to `verify` and CI because AGENTS specifies publint and Are the Types Wrong.
- Browser smoke test includes axe, keyboard, target and computed-colour evidence to satisfy the closing accessibility audit.
- Development minimum is Node 20.19 (or 22.13+), rather than every Node 20 patch, because current compatible Vite, ESLint and jsdom require those patch levels.
- Following AGENTS section 0 and the existing human edit, metadata uses `@qasimfida/accessiblit` rather than the earlier conversational unscoped suggestion.
- Explicit Phase 0 throwing stubs are the temporary exception to the final runtime contract; no production behavior is claimed. All public option names, instance method signatures and 18 IDs match AGENTS section 5/6. Message keys and the change-event field name `id` are defined here because AGENTS does not prescribe them.

## Handoff notes for the next phase

Review and merge this Phase 0 PR manually. Start Phase 1 from pulled `main` after that merge, on `phase/1-core`. Move shared types to `src/core/types.ts` while preserving public re-exports; replace stubs, implement SSR no-op init, lifecycle, registry, storage and store. Raise core coverage to the Phase 1 requirement of 90% lines and branches; keep existing gates intact. Add the React entry when implemented. Do not publish or merge automatically.
