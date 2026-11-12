# 0002 — Use CSS zoom for whole-layout scaling

Status: Accepted for Phase 3.

## Comparison

`e2e/content-prototypes.spec.ts` tested CSS zoom and root transform scaling in Chromium 158, Firefox 159 and WebKit 27.2. All engines produced these results at 200% after scrolling 600px:

| Measurement         | CSS zoom | Transform with 50% width compensation |
| ------------------- | -------: | ------------------------------------: |
| Fixed header top    |      0px |                                -600px |
| Fixed header height |    152px |                                 152px |
| Header width        |   1280px |                                1280px |
| Sticky note top     |    224px |                                 824px |

The baseline header was 76px tall. Both approaches enlarge it, but the transformed root becomes the containing block for fixed descendants: the header scrolls away. Sticky positioning also diverges. A transform additionally needs width compensation and leaves layout/painting coordinates harder to reconcile.

## Decision

Use an html class and variable in the single page stylesheet to set CSS zoom. Preserve any existing computed author zoom by multiplying its baseline by the selected 100–200% factor; 100% applies no override. Cleanup removes the rule/class/variable and restores the original page.

The shadow UI already compensates measured author zoom while retaining browser zoom. Feature implementation must use the existing registry and must not edit UI rendering. All three browsers must verify every scale level, fixed/sticky anchors, reset and UI isolation.

## Limits

Zoom changes effective layout width, wrapping and geometry. Fixed-width content, off-screen elements, scroll positions, cross-origin frames and author scripts that assume unscaled coordinates may behave differently. It does not reconstruct clipped containers or repair site layout. Inline important zoom and more-specific author important rules can prevent a stylesheet override. Existing transforms remain owner-controlled.

The fixed-header fixture reserves space for its responsive header and gives the sticky note a separate inset. Real sites that do not reserve fixed-header space can overlap at large text settings; scaling cannot infer their intended layout. Browser toolbar/pinch zoom is distinct from this author CSS feature and must remain usable. Unsupported or blocked CSS/CSP environments cannot be repaired with a runtime request.
