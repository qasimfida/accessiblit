# AGENTS.md — Accessiblit (accessibility personalisation widget)

> Read this whole file at the start of every session. Every phase prompt assumes it. If a prompt and this file disagree, this file wins, and you must say so in the report.

## 0. Project constants (the human edits these BEFORE Phase 0)

| Constant | Value |
|---|---|
| PKG_NAME | @qasimfida/accessiblit |
| GLOBAL_NAME | Accessiblit |
| REPO_URL | https://github.com/qasimfida/accessiblit |
| PAGES_URL | https://qasimfida.github.io/accessiblit/ |
| AUTHOR | Qasim Fida qasimfida0054@gmail.com |
| LICENSE | MIT |
| DEFAULT_BRANCH | main |

If any value still contains `YOUR_`, stop and ask the human. Do not guess.

## 1. Mission and non-goals

Build a drop-in accessibility personalisation widget: one script, 18 user-facing features, usable from plain JS, TypeScript, React, Next.js, WordPress and any other site.

Non-goals: it does not claim to make a site WCAG compliant, does not auto-remediate page markup, has no AI, no server, no accounts, no analytics by default.

## 2. Hard rules (never break these)

1. **Never run** `npm publish`, `npm login`, `npm token`, `npm unpublish`, `npm deprecate`, `git push --force`, or rewrite history that has already been pushed. Publishing is done by the human only.
2. **No secrets.** Never read, print, create or commit tokens, `.env` files or credentials. In CI, reference secret names only (for example `NPM_TOKEN`).
3. **Original code only.** Do not copy code, text, icons or assets from a11yfirst.com, from the npm package `@a11yfirst/toolkit`, or from any other widget. Implement from the feature descriptions in section 6. Runtime dependencies: zero. Dev dependencies are allowed.
4. **No network at runtime.** No requests, no cookies, no analytics, no remote fonts or images. The only storage is `localStorage` under one key, always inside try/catch.
5. **No `eval`, `new Function`, `document.write`**, and no `innerHTML` with dynamic strings.
6. **Never claim something passes unless you ran it in this session and saw the result.** Paste real numbers. If you cannot run something, say so.
7. **Never weaken a quality gate** (size budget, coverage, lint rules, axe rules) to make it pass. Fix the cause, or report it as a blocker.
8. Ask the human only when blocked (missing constants, credentials, or a genuinely ambiguous requirement). Otherwise state the assumption in the report and continue.

## 3. Tech stack

- Language: TypeScript (strict). Output must be usable from both JS and TS.
- Library build: **tsup** → ESM, CJS, IIFE (browser global), `.d.ts`.
- Demo and docs site: **Vite** (static), deployed to GitHub Pages.
- Unit tests: **Vitest** + jsdom. Browser tests: **Playwright** (Chromium, Firefox, WebKit) + **@axe-core/playwright**.
- Lint and format: ESLint (flat config, typescript-eslint) + Prettier.
- Size: **size-limit**. Package checks: **publint**, **@arethetypeswrong/cli**.
- Package manager: npm. Node 20+ (CI matrix 20 and 22).
- Compile target: ES2019. Browsers: last 2 versions of Chrome, Edge, Firefox, Safari, plus iOS Safari and Android Chrome.

## 4. Repository layout

```
src/
  index.ts            public API (init, destroy, types)
  core/               host, store, storage, registry, styles, announcer, lifecycle
  features/           one file per feature (18)
  ui/                 launcher, panel, controls
  react/              React helper (separate entry point)
tests/                unit tests
e2e/                  Playwright tests
fixtures/             host pages used by e2e tests
examples/             html, react-vite, nextjs, node-ssr-check
site/                 demo and docs site (Vite)
docs/                 architecture, ADRs, guides
reports/              one report per phase (committed)
scripts/              build helpers (sri.mjs, etc.)
.github/workflows/    ci.yml, pages.yml, release.yml
```

## 5. Public API contract

```ts
init(options?: AccessiblitOptions): AccessiblitInstance
destroy(): void

interface AccessiblitOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; // default bottom-right
  features?: FeatureId[];       // allowlist, default all 18
  exclude?: FeatureId[];
  storageKey?: string;          // default 'accessiblit:v1'
  persist?: boolean;            // default true
  shortcut?: string | false;    // default 'Alt+A'
  zIndex?: number;              // default 2147483000
  offset?: { x: number; y: number };
  nonce?: string;               // for strict CSP
  messages?: Partial<Messages>; // English default, i18n-ready
  dyslexiaFontUrl?: string;     // optional, supplied by the site owner
  onChange?: (e: ChangeEvent) => void; // opt-in hook, never receives personal data
}

interface AccessiblitInstance {
  open(): void; close(): void; toggle(): void; reset(): void;
  getState(): Record<FeatureId, unknown>;
  setFeature(id: FeatureId, value: unknown): void;
  destroy(): void;
}
```

- CDN: `Accessiblit.init()` and `Accessiblit.destroy()` on the global.
- React entry (`PKG_NAME/react`): `AccessiblitWidget` component and `useAccessiblit` hook. `react` is an optional peer dependency (>=17).
- `init` is **idempotent**: calling it again destroys the previous instance and creates a new one (safe under React StrictMode).
- `init` and every import must be **SSR-safe**: importing in Node must not touch `window` or `document`; `init` is a no-op without a DOM.
- `destroy` must leave **zero residue**: no DOM nodes, styles, classes, attributes or listeners.

## 6. Feature catalogue (18)

| Group | Feature id | Behaviour |
|---|---|---|
| Content | `fontSize` | Scale text 80%–200%, step 10 |
| Content | `lineHeight` | Off / 1.5 / 1.75 / 2 |
| Content | `letterSpacing` | Off / 0.12em / 0.16em / 0.2em |
| Content | `wordSpacing` | Off / 0.16em / 0.24em / 0.32em |
| Content | `textAlign` | Off / left / center / right (text blocks only) |
| Content | `contentScale` | Zoom the whole layout 100%–200% |
| Content | `readableFont` | Off / readable / dyslexia-friendly (no bundled font) |
| Colour | `darkMode` | Dark background, light text |
| Colour | `highContrast` | Strong text/background contrast |
| Colour | `monochrome` | Remove all colour |
| Colour | `lowSaturation` | Reduce colour intensity |
| Navigation | `readingGuide` | Horizontal line follows pointer or focus |
| Navigation | `readingMask` | Dim everything except a strip at the pointer or focus |
| Navigation | `highlightLinks` | Outline and underline links |
| Navigation | `highlightHeadings` | Outline headings with a level badge |
| Navigation | `bigCursor` | Larger mouse cursor |
| Navigation | `stopAnimations` | Stop CSS animation, transitions, smooth scroll, autoplay video |
| Navigation | `focusHighlight` | Stronger keyboard focus ring |

## 7. Accessibility standard for the widget itself (WCAG 2.2 AA)

The widget must meet these on any host page:

- Keyboard: 2.1.1, 2.1.2 (no trap), 2.1.4 (shortcut is modifier-based and configurable), 2.4.3 focus order, 2.4.7 and 2.4.11 (focus never hidden by the widget).
- Targets and pointer: 2.5.8 targets at least 24×24 px (aim for 44), 2.5.3 label in name, 2.5.7 no drag-only interactions.
- Perceivable: 1.1.1 icons hidden from AT or labelled, 1.3.1 real groups, headings and labels, 1.4.1 no colour-only meaning, 1.4.3 and 1.4.11 contrast, 1.4.4 and 1.4.10 reflow (320 px wide, 400% zoom), 1.4.12 text spacing, 1.4.13 n/a unless tooltips exist.
- Robust: 4.1.2 name/role/value (use `aria-pressed`, `aria-expanded`, `aria-controls`), 4.1.3 status messages via a live region.
- Also honour `prefers-reduced-motion`, `forced-colors`, `prefers-color-scheme`, and RTL (use logical CSS properties).
- Panel semantics: launcher is a `<button>`; panel is a non-modal `role="dialog"` with an accessible name; `Esc` closes and returns focus to the launcher.

## 8. Quality gates (`npm run verify` must pass)

- Lint, typecheck, unit tests, build, size budget.
- Browser bundle (IIFE, minified + gzip) **≤ 35 KB**. Warn at 30 KB.
- Coverage: core logic ≥ 85% lines and branches.
- axe: **0** violations on the widget in every tested state.
- Init time gate: median `init()` time ≤ 50 ms, measured on the reference machine (the maintainer's Mac: record model, chip, RAM and macOS version in the report; get them with `sysctl -n machdep.cpu.brand_string` and `sw_vers`). Method: `npm run perf`, headless Chromium and WebKit, plugged in, other apps closed, 5 warm-up runs discarded, then 30 measured runs, timed with performance.now() around init() only (excluding browser start-up). Report median, p95 and the raw samples in reports/perf-macos.json. The gate is the median. Shared CI runners are not valid for absolute timing: CI runs the same script as a report-only trend check, plus a regression guard that fails if the median grows more than 50% against the committed baseline.
- `npm audit --omit=dev` reports nothing (there should be no runtime deps).

## 9. Engineering standards

- Small modules, no god files (soft limit: 250 lines per file).
- Feature modules implement one interface (`id`, `group`, `label`, `description`, `control`, `apply(value, api) → cleanup`). The UI is generated from the registry; adding a feature never edits the UI code.
- Page-affecting CSS goes into one injected stylesheet (or `adoptedStyleSheets` where available) driven by classes and CSS variables on `<html>`. No per-element inline styles.
- Doc comments on every exported symbol. Explain *why* in comments, not *what*.
- Errors in one feature must never break the others or the host page.
- Document every cross-site limitation honestly instead of hiding it.

## 10. Git workflow (single branch, granular commits)

- Work directly on `main`. No feature branches, no pull requests. Before starting a phase: `git pull --ff-only`, working tree clean.
- **One logical change per commit.** Every feature, bug fix, refactor, design or style change, test addition, doc update and config change gets its own commit. Never batch unrelated changes. If you notice a second change while working, finish and commit the first, then do the second. Expect dozens of commits per phase; that is intended.
- Conventional commits: `type(scope): imperative summary` (72 characters or fewer). Types: `feat`, `fix`, `refactor`, `style` (visual or design change), `perf`, `test`, `docs`, `build`, `ci`, `chore`. Scope is the module or feature id, for example `feat(font-size): add stepper levels` or `fix(store): ignore corrupted storage`.
- Add a short body when the reason is not obvious: why, what changed, how it was verified. Reference review findings by id (for example `Review finding R-3`).
- Tests go in the same commit as the code they cover, or in the commit immediately before it.
- Before every commit run the fast checks: `npm run lint`, `npm run typecheck`, and the unit tests for the touched modules. Every commit must leave `main` building and passing those. Run the full `npm run verify` (plus e2e where relevant) before every push.
- Review and audit fixes: one commit per finding (`fix(...)` or `refactor(...)` with the finding id). Never squash them into earlier commits.
- Never amend, rebase or force-push commits that were already pushed. Fix forward with a new commit. (Amending a local, unpushed commit is allowed.)
- Never commit generated output (`dist`, `coverage`, `test-results`). Reports and screenshots under `reports/` are committed.
- Push to `main` after the full verify at the end of each phase, and after any coherent chunk of work. Then create and push an annotated tag `phase-<n>-complete` as the rollback and review point.

## 11. Closing protocol (run at the end of EVERY phase, in the same session)

1. Run `npm run verify`, plus any phase-specific commands. Fix failures.
2. **Self-review** your own diff against sections 2, 7 and 9. List findings by severity (Blocker, High, Medium, Low). Fix every Blocker, High, and all Medium findings you can, one commit per finding (section 10). Re-run verify.
3. **Accessibility audit** for what this phase touched: axe results, a keyboard-only walk-through in a real browser, computed target sizes and contrast where relevant. Record evidence.
4. **Security and privacy audit**: no network calls, no new storage, no unsafe DOM APIs, `npm audit`, dependency review.
5. **Performance and size audit**: report bundle sizes and any timing measured.
6. Write `reports/phase-<n>-<slug>.md` using section 12 and commit it (`docs(report): ...`). Include the fixes you applied (with commit hashes), not just problems.
7. Run the full `npm run verify`, `git push`, then create and push the tag `phase-<n>-complete`.
8. Final chat message: at most 15 lines: result (PASS or BLOCKED), the phase commit list (`git log --oneline` since the previous tag), top risks, and what the human must do next.

If an acceptance criterion still fails after three honest attempts, stop and report the blocker. Do not paper over it.

## 12. Report template

```
# Phase <n> — <title>
Status: PASS | PASS WITH NOTES | BLOCKED
Date / commit range (previous tag to this tag)

## Summary
## What changed (files and why)
## Verification (commands run, real results)
## Review findings and fixes (table: severity | finding | fix | status)
## Audits
- Accessibility (evidence)
- Security and privacy
- Performance and size (numbers)
## Known limitations (honest)
## Deviations from the prompt (and why)
## Handoff notes for the next phase
```