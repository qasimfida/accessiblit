# Phase 0 — Bootstrap

Status: PASS WITH NOTES
Date: 2026-11-12
Commit range: `3d4989c` (initial instructions; no previous phase tag) to `phase-0-complete`.

## Summary

Established the package, strict TypeScript API stub, library outputs, test runners, coverage and size gates, formatting, CI and dependency updates. Runtime dependencies: **0**. The browser widget is intentionally not implemented in this phase.

Read AGENTS.md completely. All project constants were populated. Initial tools: Node **24.13.0**, npm **11.6.2**, Git **2.50.1**. Worked on `main`; `git pull --ff-only` reported already up to date. The human authorized committing the existing instructions and a bootstrap exception to pre-commit checks until tooling existed. The generated directories were ignored; their contents were not committed. Once configured, lint, typecheck and all unit tests ran before every foundation/fix/report commit.

## What changed (files and why)

- `package.json`, `package-lock.json`: exact dev-tool versions, package identity, conditional ESM/CJS type exports, browser entry and all requested scripts. Added package-validation scripts so both specified package checkers are used.
- `src/index.ts`, `tests/`: all 18 feature identifiers and real public types; browser initialization throws `not implemented`; SSR initialization returns an inert instance. Imports and teardown are safe without browser globals.
- `tsconfig.json`, `tsup.config.ts`: strict ES2019 checking, DOM libraries, unchecked-index protection, isolated modules; minified ESM/CJS/IIFE builds, maps and declarations.
- ESLint, Prettier, EditorConfig and Git configuration: consistent source formatting, LF text, and exclusions for generated files and `.env*`. Prettier preserves human-maintained AGENTS.md and npm-managed lockfile formatting.
- `vitest.config.ts`: jsdom, V8 coverage for all source, global 85% line/branch gates and an independent 85% core gate. `playwright.config.ts`, `e2e/`, `fixtures/`: three engines, local Vite fixture server, axe and keyboard smoke checks.
- `.size-limit.json`, `scripts/`: 35,000-byte gzip limit, 30,000-byte warning and portable cleanup. Reserved the reports/scripts directories.
- MIT `LICENSE`, one-paragraph `README.md`, CI and weekly Dependabot configurations. No pull request template.

## Verification (commands run, real results)

Verification ran on macOS in this session. Disposable Git clones contained only committed files. After R-2, both clones fast-forwarded to `5d4ac82`, then performed fresh strict installs and full verification again.

| Command / check                                   | Environment                                               | Observed result                                                                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                          | Node 24.13.0                                              | Passed; after lock regeneration, 291 packages installed, 0 vulnerabilities.                                                                                                 |
| `npm ci --engine-strict`                          | Clean clones, Node 20.20.2 and 22.23.5                    | Both passed with the final lockfile; 291 packages installed, 0 vulnerabilities, no engine errors.                                                                           |
| `npm run verify`                                  | Node 24 baseline; final lockfile on Node 20 and 22 clones | Passed: lint, formatting, typecheck, 4 unit tests across 2 files, all build outputs and size.                                                                               |
| `npm test`                                        | Node 20, 22 and 24                                        | 4/4 passed; lines 100% (5/5), branches 100% (4/4), functions 100% (3/3). These are stub runtime counts, not feature coverage.                                               |
| `npx playwright install chromium firefox webkit`  | Local browser cache                                       | Completed successfully.                                                                                                                                                     |
| `npm run test:e2e`                                | Node 24; also CI mode under Node 20 and 22                | 3/3 browser tests passed per run, covering Chromium, Firefox and WebKit; 0 axe violations in each.                                                                          |
| `npm run check:package`                           | Node 20, 22 and 24                                        | publint: all good; Are the Types Wrong: no problems in its four resolution modes.                                                                                           |
| `actionlint`                                      | Installed actionlint 1.7.12                               | Exit 0, no diagnostics. CI YAML was machine-validated.                                                                                                                      |
| `npm audit` and `npm audit --omit=dev`            | Main and Node 20/22 clones                                | Both report 0 vulnerabilities.                                                                                                                                              |
| `npm ls --depth=0` after R-2                      | Main and clean clones                                     | All 17 declared dev tools present; no extraneous packages.                                                                                                                  |
| Built ESM/CJS Node imports                        | Node 24, no DOM                                           | Import, `init`, 18-key state and `destroy` succeeded for both formats.                                                                                                      |
| Browser IIFE probe                                | Real Chromium                                             | Global exports exactly `destroy`, `init`; 0 requests; 3 host descendants, 0 stylesheets and root attributes unchanged on import, excluding the harness script element.      |
| Negative coverage probe                           | Disposable Node 22 clone                                  | 5 tests passed but runner correctly exited 1: core lines 0% failed the independent 85% gate while global lines were 87.5% and branches 100%. Probe files removed afterward. |
| `npm run clean`                                   | Disposable clone                                          | Removed dist, coverage, test-results and playwright-report; tracked tree remained clean.                                                                                    |
| `git diff --check`, generated-file tracking check | Main                                                      | No whitespace errors; 0 tracked generated/dependency files.                                                                                                                 |

The initial TypeScript 6 declaration build failed because tsup 8 internally uses deprecated `baseUrl`. TypeScript 5.9.3 fixes that compatibility issue without suppressing compiler diagnostics. The first dependency audit found 11 advisories (1 low, 10 moderate). Patched minimatch/esbuild overrides reduced the audit to 0. These choices are in `3fc9a9f`; subsequent review fixes are listed below.

Coverage thresholds follow the documented [Vitest coverage configuration](https://vitest.dev/config/coverage).

## Review findings and fixes

Reviewed the full source/configuration diff against AGENTS.md sections 2, 7 and 9. No Blocker or High findings remain. Both Medium findings were fixed in separate commits. No unresolved Low findings were identified.

| Severity | Finding                                                                                                                                                                        | Fix                                                                                                                                                                                                 | Status              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Medium   | R-1: a global coverage threshold could mask insufficient core coverage when other modules are well tested.                                                                     | `99b0dc7`: independent `src/core/**` 85% line/branch threshold, retaining global gates. Negative probe proved rejection while aggregate coverage passed.                                            | Fixed and verified. |
| Medium   | R-2: lock generation inherited an incomplete optional dependency graph and platform-specific layout from pre-existing node_modules; clean installs left 2 extraneous packages. | `5d4ac82`: regenerated the lock from package.json in an empty directory, restoring the complete registry graph/metadata. Fresh installs and matrix verification passed with no extraneous packages. | Fixed and verified. |

## Audits

### Accessibility

- Axe: **0 violations** on the semantic fixture in Chromium, Firefox and WebKit. The test asserts the actual violation array is empty.
- Real-browser keyboard smoke: Tab, Shift+Tab and Escape completed; the heading remained visible. Also performed these keys in the Chromium IIFE probe.
- The fixture has no interactive controls and Phase 0 adds no widget UI. Launcher/panel focus order, focus return, target dimensions, control contrast, reflow, forced colours, RTL and feature states therefore have no implementation to audit yet. No widget WCAG conformance is claimed.

### Security and privacy

- Runtime dependencies: **0**. Source review and targeted searches found no networking, cookies, storage calls, unsafe dynamic DOM APIs, eval or generated function execution in the library. The IIFE import probe observed **0 network requests**.
- No secrets, credentials or `.env` files were read, created, printed or committed. No publishing or history-rewriting commands were run.
- Both complete and production-only npm audits: **0 vulnerabilities**. Lockfile committed. All direct dev tools are justified below; no unused direct dev dependencies were added.
- CI has only `contents: read`, commit-pinned actions and `persist-credentials: false`. No step echoes secrets. Node matrix is 20/22; package checks and complete npm audit supplement the requested steps.
- `.gitignore` was checked against node_modules, dist, coverage, test-results, `.env` and `.env.local`; all matched. Generated output is untracked.
- MIT text, 2026 copyright, author/email, package name/version, repository, issue URL and Pages homepage match the supplied constants.

### Dev dependency justification

| Dependency            | Version  | Used by                                                                           |
| --------------------- | -------- | --------------------------------------------------------------------------------- |
| TypeScript            | 5.9.3    | Strict typecheck and tsup declarations; newest compatible stable 5.x release.     |
| tsup                  | 8.5.1    | All library formats and declaration generation.                                   |
| ESLint                | 10.14.0  | Lint command with zero allowed warnings.                                          |
| @eslint/js            | 10.0.1   | Base recommended rules in the flat config.                                        |
| typescript-eslint     | 8.72.2   | TypeScript parser/plugin and recommended flat rules.                              |
| Prettier              | 3.10.1   | Format and formatting-check scripts.                                              |
| Vitest                | 4.1.12   | Unit runner and test configuration.                                               |
| @vitest/coverage-v8   | 4.1.12   | V8 provider required by the coverage gate.                                        |
| jsdom                 | 29.1.1   | Browser-like unit environment.                                                    |
| Vite                  | 8.3.8    | Local fixture server for dev and Playwright.                                      |
| @playwright/test      | 1.65.0   | Three-engine browser runner/configuration.                                        |
| @axe-core/playwright  | 4.13.0   | Actual axe scans in the browser smoke test.                                       |
| size-limit            | 12.1.0   | Gzip budget CLI.                                                                  |
| @size-limit/file      | 12.1.0   | File measurement plugin used by size-limit.                                       |
| publint               | 0.3.25   | Package metadata/export validation, executed locally and in CI.                   |
| @arethetypeswrong/cli | 0.18.5   | Packed-package TypeScript resolution checks, executed locally and in CI.          |
| @types/node           | 20.19.43 | Types for Node-based configuration and tooling, aligned with the oldest CI major. |

Versions were checked against the npm registry's stable releases and engine/peer requirements. Absolute latest tsup 9, Vitest 5, jsdom 31, size-limit 14 and axe Playwright 4.14 require newer Node versions than the mandatory Node 20 matrix. TypeScript 7 is outside typescript-eslint's supported range; TypeScript 6 also fails tsup 8 declaration generation. Selected stable compatible branches instead. Vite/tooling requires Node 20.19+ (and Node 22.13+ for the complete development stack).

Overrides pin minimatch **11.0.8** and tsup's esbuild **0.28.2**, addressing the audit findings without downgrading gates or using audit suppression. Matrix lint/build/tests validate their compatibility. Re-evaluate the overrides when upstream packages adopt patched dependencies.

### Performance and size

| Artifact                    |   Bytes |
| --------------------------- | ------: |
| ESM `dist/index.js`         |     621 |
| CJS `dist/index.cjs`        |   1,077 |
| IIFE `dist/index.global.js` |   1,102 |
| IIFE gzip                   | **607** |
| `index.d.ts`                |   2,221 |
| `index.d.cts`               |   2,221 |

All JavaScript outputs are minified and have sourcemaps. Gzip remains below the **30,000-byte** warning and **35,000-byte** hard budget. The probe found no host element/style/attribute changes on import. Browser initialization timing and layout-shift measurements for an implemented widget are deferred; a throwing stub cannot establish the 50 ms/zero-CLS feature acceptance criteria.

## Known limitations (honest)

- Browser `init` deliberately throws `not implemented`. No feature implementation, launcher, panel or React helper ships yet. SSR state has all 18 keys with undefined values and inert lifecycle methods.
- `Messages` and `ChangeEvent` have explicit initial shapes because the contract names them without specifying their members; later implementation must reconcile these types with its UI and store before a stable release.
- Existing tests validate the bootstrap/stub and fixture, not the eventual widget or arbitrary host sites.
- Local tests ran on macOS. Hosted Ubuntu CI execution is not claimed by this report; the committed workflow performs those checks after push.
- Compatible stable tool branches and two documented transitive overrides are necessary for the requested matrix; absolute latest majors are not all Node-20-compatible.

## Deviations from the prompt (and why)

- The human explicitly approved preparation commits for existing AGENTS.md changes and the bootstrap pre-check exception. Initial commits necessarily precede the complete tooling/configuration they introduce. Fast checks ran before every foundation commit once the working tooling existed.
- Followed AGENTS.md section 5 over the prompt's general permission to throw from init: without a DOM, init is a no-op rather than throwing.
- Chose the newest compatible stable tool branches rather than incompatible absolute latest majors, preserving the mandatory Node 20/22 matrix. No lint, coverage, size or axe gate was reduced.
- `dev` serves fixtures until a later phase creates the Vite docs/demo site. React's optional peer and entry point are deferred until the helper exists, avoiding an unused dependency.
- Added meaningful SSR contract tests and axe checks beyond the requested trivial smoke tests; added package validation and audit CI steps so required tools are actually exercised.

## Handoff notes for the next phase

Start Phase 1 from `phase-0-complete`. Implement the core lifecycle, storage, registry and failure isolation without weakening the established gates. Replace browser stub assertions as behaviour is implemented. Add widget-specific keyboard, contrast, target-size and feature-state browser tests when UI exists; measure init performance and CLS at that point.

The rollback/review point is the annotated `phase-0-complete` tag on main. No npm publication is part of this phase.

### Phase commit list

The report commit follows this list; the phase tag identifies that report commit. Obtain the full list, including this report, with `git log --oneline 3d4989c..phase-0-complete`.

```text
349817d docs(instructions): set project constants and phase workflow
f8ea1da chore(git): ignore dependencies and generated artifacts
3fc9a9f build(package): define metadata scripts and locked dev tooling
f6e7e29 build(typescript): enable strict ES2019 type checking
ebf87b4 feat(api): reserve typed public API and SSR-safe lifecycle
efb86c0 build(tsup): emit minified library formats and declarations
e7132e7 chore(lint): configure ESLint and Prettier checks
eef4770 chore(editor): standardize whitespace and file encoding
42e93a8 chore(git): normalize text files and mark binary assets
65373c0 test(vitest): enforce coverage in the jsdom unit suite
3c4a569 test(playwright): configure three engines and axe smoke checks
ccb0e4f test(fixtures): add a semantic browser host page
7c3c6d1 build(size): enforce gzip budget and warn at 30 KB
12cab14 chore(scripts): add portable generated-artifact cleanup
cdb21e0 docs(license): add MIT terms and author attribution
7e4fe86 docs(readme): introduce scope and bootstrap status
ce8a524 ci(checks): verify Node 20 and 22 with read-only permissions
474acff ci(dependabot): schedule weekly tooling and action updates
97759f9 docs(reports): reserve phase audit directory
99b0dc7 fix(coverage): enforce the core threshold independently
5d4ac82 fix(lockfile): regenerate a complete dependency graph
```
