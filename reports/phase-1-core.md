# Phase 1 — Core runtime

Status: PASS WITH NOTES
Date: 2026-11-12
Commit range: `phase-0-complete..phase-1-complete` (main).

## Summary

Built a tested SSR-safe core engine with validated options/settings, safe versioned persistence, native tab sync, isolated reversible feature application, shared page styles, a deferred open-shadow host and a hidden live announcer. No visible UI or real features ship. Runtime dependencies remain **0**.

Read AGENTS.md completely, including continuous section 10 commit rules. At phase start, `main` was clean, `git pull --ff-only` reported already up to date, and `phase-0-complete` existed. All work stayed on main. Lint, typecheck and unit tests ran before every commit; tests accompany the code they cover. No bootstrap exception was used this phase.

## What changed (files and why)

- `src/core/types.ts`, `schema.ts`, `options.ts`, `diagnostics.ts`: the 18 feature ids, real metadata/control/resource contracts and public types; fresh defaults, domain checks and contained once-only diagnostics. Invalid JavaScript values/getters/proxies cannot escape option resolution into the host.
- `storage.ts`, `store.ts`: schema version 1, strict primitive validation, capped JSON reads, pollution-key rejection, memory fallback, defensive snapshots, subscriptions, reentrant notification queue, reset and cross-tab storage events without echo writes. Hooks receive exactly `{ id, value }`.
- `scope.ts`, `registry.ts`: idempotent reverse-order teardown and feature isolation, including partial setup, throwing cleanup and announcements. Two fake effects are only in `tests/helpers/features.ts` and the development fixture.
- `sheet.ts`, `styles.ts`: one lazy document sheet, constructed-sheet/nonce fallback, root class reference counts and CSS-variable stacks. Existing attributes, values and priorities restore exactly; unrelated host changes remain.
- `host.ts`, `announcer.ts`, `lifecycle.ts`, `src/index.ts`: single open shadow mount, DOMContentLoaded deferral/cancellation, 1px clipped polite status region, synchronous preference application before host creation, safe repeated init/destroy and SSR no-op behavior.
- `tsup.config.ts`, `package.json`, `examples/node-ssr-check/index.mjs`: ESM now emits the explicitly requested `dist/index.mjs`; package exports point there. Build also runs plain Node ESM/CJS import and lifecycle assertions.
- `tests/core/`, existing API/SSR tests, `fixtures/core.html`, browser tests: 81 unit tests and 21 browser cases. Core coverage gate increased from 85% to 90% lines/branches. No gate was lowered.
- `docs/architecture.md`: ownership, state wire format, CSP, public API scope and cross-site limitations. `reports/phase-1-browser-evidence.json` contains the final browser measurements and case statuses.

## Verification (commands run, real results)

Local tools: Node **24.13.0**, npm **11.6.2**, Git **2.50.1**. Verification was executed in this session on macOS; hosted Ubuntu CI is not claimed.

| Command / check                              | Observed result                                                                                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                               | ESLint with zero allowed warnings and Prettier check passed before each commit.                                                                                                         |
| `npm run typecheck`                          | Strict TypeScript passed before each commit.                                                                                                                                            |
| `npm test`                                   | **81/81 tests passed**, 13 files. Whole source: 488/491 lines (99.38%), 295/301 branches (98%).                                                                                         |
| Core-only coverage                           | **485/488 lines, 295/301 branches**; Vitest reports **99.38% lines, 98% branches**, exceeding both independent 90% core gates.                                                          |
| `npm run verify`                             | Passed after implementation, review fixes and final host isolation fix: lint, typecheck, coverage tests, all builds, plain Node SSR and size.                                           |
| Fresh clones: Node 20.20.2 / 22.23.5         | `npm ci --engine-strict`, verify, package checks and both audits passed. After R-7 both clones fast-forwarded to `8955340` and passed verify/package checks again.                      |
| `npm run build` / `npm run check:ssr`        | Minified ESM `.mjs`, CJS, IIFE, maps, `.d.ts` and `.d.cts` emitted; actual plain Node imports do not touch a throwing window getter, and SSR init/destroy are inert.                    |
| `npm run check:package`                      | publint: all good; Are the Types Wrong: no problems in all four resolution modes, on Node 20, 22 and 24.                                                                                |
| `CI=true npm run test:e2e`                   | Final equivalent Playwright JSON run: **21 expected, 0 unexpected, 0 skipped, 0 flaky**, **15.69 s**. Chromium, Firefox and WebKit all pass.                                            |
| Axe                                          | Every executed scan asserts an empty violation array: **0 violations** on fixture, fake effect states, both real tabs, strict CSP modes and aggressive-host-CSS state.                  |
| `npm audit`, `npm audit --omit=dev`          | **0 vulnerabilities**, including strict-install clones. No dependency or lockfile changes this phase.                                                                                   |
| `actionlint`                                 | Passed with no diagnostics; workflow remains unchanged.                                                                                                                                 |
| `git diff --check`, tracking/source searches | Passed; 0 tracked dist/coverage/test-results/node_modules artifacts. No unsafe DOM or network APIs in src; storage access is confined to the adapter. Largest source module: 161 lines. |

Tests cover blocked storage/getters, malformed/oversized JSON, old versions, quota errors, prototype-pollution payloads, double init, StrictMode, early init, deferred cancellation, reentrant init/hooks, throwing apply/cleanup/subscribers and failed style installation.

The exact-teardown test compares body HTML, head HTML and all html attributes before/after init and proves both owned listener registrations match one exact removal each (target/type/function/capture). Deferred-host tests prove the DOMContentLoaded listener is removed or cancelled. The same integrated test tracks the two announcement timer handles and proves both are cancelled; separate announcer tests assert no pending owned task after teardown. The harness tracks window/document methods directly and excludes jsdom-internal jobs rather than treating all platform jobs as library timers.

## Review findings and fixes

Self-reviewed against AGENTS.md sections 2, 7 and 9. No Blocker findings. All High/Medium findings and the Low portability finding were fixed in distinct commits and verified.

| Severity | Finding                                                                                                                                                      | Fix                                                                                                                                                                                   | Status |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| High     | R-7: external important div styles overrode the mount and produced a visible **246×146 static box** in all engines, violating the no-visible-UI/layout goal. | `8955340`: shadow-important reset and fixed zero-size geometry. The same aggressive CSS now yields a fixed **0×0** host, with axe and exact DOM restoration passing in all 3 engines. | Fixed. |
| Medium   | R-1: valid `Control+Shift+A` shortcuts were rejected because validation required a particular modifier order.                                                | `e369979`: parse modifiers independently, reject duplicates and bare/Shift-only character shortcuts; regression cases pass.                                                           | Fixed. |
| Medium   | R-2: Array.every skipped holes in sparse feature lists and admitted undefined ids.                                                                           | `7bd0cd6`: validate iterator values and warn/fall back for sparse allowlists/exclusions.                                                                                              | Fixed. |
| Medium   | R-3: failed style insertion could retain a failed rule and cache an unattached sheet, affecting a healthy feature.                                           | `5d1a0d3`: acquire rollback before rendering and cache only successful style installation. Fault injection proves healthy CSS installs without the failed rule.                       | Fixed. |
| Medium   | R-4: raw invalid external JSON was rejected but retained in the fallback cache.                                                                              | `063ce80`: cache only validated, size-bounded external strings; corrupt/oversized reads use clean defaults.                                                                           | Fixed. |
| Medium   | R-5: a throwing apply could announce a partial result, and stale feature APIs could announce after disable.                                                  | `6d8e363`: commit setup messages only after successful apply and check resource-scope lifetime for later announcements.                                                               | Fixed. |
| Low      | R-6: the keyboard test assumed macOS Option+Tab behavior for every WebKit platform.                                                                          | `d1f1acd`: limit Option+Tab to macOS WebKit; retain ordinary Tab elsewhere and unchanged focus assertions. Local 3-engine checks pass; Ubuntu remains CI validation.                  | Fixed. |

## Audits

### Accessibility

- The shadow status region is `role=status`, `aria-live=polite`, `aria-atomic=true`; browser-computed size is **1×1 px** with **inset(50%)** clipping. Repeated text, textContent safety, coalescing, 512-code-unit cap and cancellation are tested.
- Keyboard-only walkthrough: Tab/Shift+Tab and Enter traverse/activate the native host link and button without interception. macOS WebKit uses Option+Tab/Option+Shift+Tab according to [Apple's documented navigation](https://support.apple.com/guide/safari/cpsh003/mac). No pointer click/focus injection was used to substitute for keyboard traversal.
- Computed fixture targets: link approximately **98.59×48 px**; button **132.20–136.20×44 px**, all at least 44×44. Measured text/background colors are rgb(17,17,17)/rgb(255,255,255), calculated contrast **18.88:1**. These are host test controls, not widget UI.
- Axe scans retain all default rules and return **0 violations**. Initial CSP probe noise was isolated to page loading/axe injection by measuring library CSP effects after load and before axe; policy and axe checks were not relaxed.
- No launcher/panel exists yet. Widget control semantics, focus return, 320px/400% UI reflow and real-feature states remain future-phase audits. No WCAG compliance claim is made.

### Security and privacy

- **0 runtime dependencies**, no network, cookies, analytics, remote assets or unsafe DOM APIs. Production probes assert **0 runtime requests** (excluding browser-native other requests such as favicon activity); source review contains no networking code.
- Only localStorage is used, under the configured single key, with every getter/getItem/setItem access inside try/catch. Real-tab tests prove exactly one write per originating change and no echo write; sessionStorage events are ignored.
- Version-1 JSON admits known ids and primitive domain values only. Unknown versions/keys, pollution keys and oversized payloads are rejected before merging; reads are bounded before parsing. Validated fallback data is capped at 4096 code units and Window-scoped. Persist false accesses no persistent storage.
- onChange payload is exactly id/value, without full state, DOM data or identity. Restoration does not call it. Throwing hooks/subscribers are contained; unchanged values produce no notification/write.
- No secrets or credentials were read, created, printed or committed. No publish/login/token commands, force push, amend or history rewriting occurred. No new dependencies were introduced; existing dev dependencies and lockfile retain their Phase 0 justification and both audits report zero vulnerabilities.
- Listener ownership and teardown are directly tested; saved preferences intentionally survive destroy. Resources acquired outside FeatureApi must be registered for cleanup, as documented.

### Performance and size

| Artifact                     |      Bytes |
| ---------------------------- | ---------: |
| ESM `dist/index.mjs`         |     12,452 |
| CJS `dist/index.cjs`         |     12,918 |
| IIFE `dist/index.global.js`  |     12,943 |
| IIFE minified + gzip         |  **5,439** |
| `index.d.ts` / `index.d.cts` | 3,555 each |

The IIFE is below the unchanged **30,000-byte** warning and **35,000-byte** hard limit. Sourcemaps exist for all JavaScript outputs. The production bundle contains no fake feature CSS/labels.

Final browser evidence (JavaScript init duration; milliseconds):

| Engine   | Samples | Median ms | Maximum ms | Measured CLS |
| -------- | ------: | --------: | ---------: | ------------ |
| chromium |      10 |      0.10 |       0.80 | 0            |
| firefox  |      10 |      0.00 |       1.00 | Unavailable  |
| webkit   |      10 |      0.00 |       1.00 | Unavailable  |

All 30 production init samples are below 50 ms. Every measured host is **0×0**, whole document HTML restores exactly, and Chromium CLS is **0**. Firefox/WebKit do not expose layout-shift entries in these tests, so their CLS values are null, not claimed as measured zero. Timer precision accounts for zero-valued samples. These are local core-only measurements, excluding script download/parse, not a calibrated mid-range-laptop benchmark or a forecast for 18 future effects/UI.

## Known limitations (honest)

- No real catalogue effects or visible UI ship; only the internal engine is implemented. Public open/close/toggle are reserved no-ops. Position, shortcut, z-index and offset settings are validated for later UI, not activated here. The optional font URL is never fetched.
- A script loaded after first paint cannot retroactively prevent a previous unadjusted paint. Load early for synchronous settings application; body readiness only delays the host.
- Strict CSP needs a matching owner nonce for fallback styles. A denied script/style policy or a host disabling DOM APIs can prevent intended behavior; the runtime does not change the policy or fetch a repair. See `docs/architecture.md` for adopted-sheet behavior and nonce responsibilities.
- Future schema versions need explicit migration. Current old/corrupt data is ignored; there is no guessed migration. In-memory fallback survives reinit only within its Window and is not a substitute for persistent storage across page reloads.
- Arbitrary direct DOM effects by a feature must register cleanup before possible failure; the runtime cannot infer their undo operation. Future real features must use the resource API consistently.
- All tests here ran on macOS. Node 20/22 were tested locally in clean installs, but hosted Ubuntu execution is not claimed. Current timing evidence covers the core only.

## Deviations from the prompt (and why)

- Public options and instance method shapes still match AGENTS.md section 5. `ChangeEvent` is narrowed from the Phase 0 placeholder's id/value/state to exactly **id/value**, as this phase explicitly requests. Messages retain the initial explicit English/i18n shape; Feature contracts are added without changing the named runtime exports.
- ESM moved from the Phase 0 `.js` filename to `.mjs` to meet the explicit plain-Node import criterion; package conditional exports and types were updated and package checks pass. Consumers should use the package entry rather than private dist paths.
- Chose ignore-and-default for invalid/old schemas, which the task permits, and 4096-code-unit input bounds. Offset defaults are 16px each axis; content-scale state uses 10-point steps pending real controls.
- Used 2 fake test-only features as requested. Feature registration remains internal; no extra production registration API or feature implementation was introduced.
- No conflict with AGENTS.md required overriding the phase prompt. No section 10 exception, feature branch or pull request was used.

## Handoff notes for the next phase

Continue from `phase-1-complete`. Add real feature modules through the registry and its scoped API; keep initial preference application synchronous. Build UI separately with the required non-modal dialog/launcher semantics and audit every actual control/state. Use the documented nonce path and preserve host CSS/attributes on teardown. Re-run init/CLS/size evidence as effects and UI are added; current 90% core, axe and size gates remain mandatory.

The phase report commit also includes the final browser evidence JSON. The annotated tag identifies that commit. No npm publication is part of this phase. Hosted CI results should be reviewed after push.

### Phase commit list

Pre-report commits are below. The complete list, including this report, is `git log --oneline phase-0-complete..phase-1-complete`.

```text
5b74c8f refactor(types): define the core feature and public contracts
59ecb94 test(coverage): require 90 percent core lines and branches
b4ab7b8 feat(schema): validate the 18 feature state domains
dacedc8 feat(options): resolve safe defaults and isolate diagnostics
e43ed01 feat(storage): persist validated versioned settings safely
55dd2ac feat(scope): track listeners and reversible resource ownership
6977fca feat(store): synchronize validated settings and change hooks
f8938d4 feat(stylesheet): manage constructed and nonce-backed sheets
f27d2f1 feat(styles): restore scoped root classes and CSS variables
079b876 feat(registry): isolate reversible feature activation failures
3181d26 feat(host): mount one shadow root when the body is ready
b44045d feat(announcer): add a disposable hidden shadow live region
48a0181 feat(lifecycle): integrate synchronous settings and safe teardown
44f9363 test(ssr): check the built mjs entry in plain Node
5f15b01 test(fixtures): add a keyboard host for the two fake features
8fb22e8 test(core): audit native tab sync keyboard access and announcements
9246ea5 test(runtime): verify strict CSP residue and init performance
e369979 fix(options): accept modifier shortcuts in any order
7bd0cd6 fix(options): reject holes in feature configuration lists
5d1a0d3 fix(styles): roll back failed rule and sheet installation
063ce80 fix(storage): discard invalid external fallback payloads
6d8e363 fix(registry): scope announcements to successful active effects
d1f1acd fix(e2e): scope Option Tab navigation to macOS WebKit
4dd59fa docs(core): document runtime ownership persistence and CSP
8955340 fix(host): isolate the invisible mount from page CSS
```
