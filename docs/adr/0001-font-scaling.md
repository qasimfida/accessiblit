# 0001 — Scale measured text sizes without compounding

Status: Accepted for Phase 3.

## Context

Changing html font-size scales rem-based text but does not resize author pixel fonts. The feature must cover 80–200% in 10-point steps, preserve different text sizes, support normal inline sizes and common important author rules, and restore exact original markup without writing per-element inline styles.

## Prototypes and evidence

`e2e/content-prototypes.spec.ts` ran in Chromium 158, Firefox 159 and WebKit 27.2. All six cases passed; all engines produced the same font measurements at 200%:

| Fixture           | Baseline px        | Root font-size 200% | Measured baseline × 2 |
| ----------------- | ------------------ | ------------------- | --------------------- |
| Legacy px         | 28, 13, 20, 18, 12 | 28, 13, 20, 18, 12  | 56, 26, 40, 36, 24    |
| Rem and nested em | 32, 16, 24, 20, 24 | 64, 32, 48, 40, 48  | 64, 32, 48, 40, 48    |

The legacy page includes important ID rules and a normal inline pixel size. Root sizing fails that page. Measured sizes cover both pages without multiplying nested em descendants twice.

## Decision

Read eligible HTML text/control font sizes in a batch before applying the font-size class. Assign reversible, private data attributes identifying baseline groups. The single page stylesheet uses those attributes, an html class and a numeric html custom property to apply `calc(baseline-px * scale) !important`. No page element receives an inline font-size.

The scoped root selector uses `:is(html,#accessiblit-a#accessiblit-b#accessiblit-c)`. The impossible three-different-ID branch deliberately raises specificity while html always matches. This beats common author important selectors without overriding user-origin important styles. Attribute values identify only this application; original attribute values are restored.

All font reads precede attribute/rule writes. Restoring preferences before body exists must observe later content before paint. Content changes and viewport/style changes must be reconciled against unadjusted baselines, with the font class temporarily disabled during measurement; cleanup cancels observers/listeners and restores attributes. Performance on 5,000 nodes remains an explicit implementation gate, not inferred from this prototype.

## Limits

- Author inline `font-size:... !important` outranks author stylesheets and cannot be overridden under the no-inline-mutation rule. Extremely specific important rules can also win. These are honest limits, not silently rewritten owner markup.
- Text can outgrow fixed-height/width containers, clipped overflow, line clamps and non-wrapping content. The feature does not reconstruct host layouts.
- Closed shadow trees, cross-origin frames, canvas text, SVG/MathML and CSS-generated text are outside this HTML classifier. Icon/code-like content must not be indiscriminately replaced with a different font.
- Measurement requires owner styles to be available. A late script cannot undo a paint that happened before it loaded; the no-flash check must use an early integration with styles loaded first.
- Responsive and dynamically inserted text need remeasurement; caching a permanent pixel size across owner style changes is not acceptable.

The alternative root-only strategy is rejected for fontSize. Layout zoom is a separate feature, with different effects and limits in ADR 0002.
