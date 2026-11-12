# 0002 — Colour strategy without layout filters

Status: Accepted on 2026-11-13, after the cross-browser prototype; implementation validation is recorded in the Phase 4 report. This filename follows the phase prompt; ADR 0002-content-scaling.md remains a separate earlier decision.

## Evidence before implementation

The original colour laboratory contains an image, decoded local MP4 video, canvas, SVG, iframe, decorative background image, gradient, fixed header, sticky note, and native modal. Eighteen prototype checks passed in Chromium, Firefox and WebKit. No widget feature implementation was present during this comparison.

We compared html invert/hue-rotate, html invert/hue-rotate/contrast, body invert/hue-rotate, and dark/high-contrast forced palettes. Media received a counter-filter in filter strategies. Root html filters preserved fixed positions in these engines: header 0px and nested probe 120px after scrolling. Applying that filter to body instead displaced them to approximately -395px and -275px. A filter's placement matters; it is incorrect to assume every root filter creates the same containing block.

Image interior colour samples changed under every filter/counter-filter combination in every engine. The palette preserved all three original samples. A native modal opened in all strategies. Computed widget colours stayed constant, which alone cannot prove rendered colours are unaffected by an ancestor filter; previous Firefox top-layer audits also show that root filters can affect widget paint.

The heavy fixture has 2,000 painted gradient/background text blocks. Sixty scroll-frame intervals and available long-task entries were recorded with and without a root filter. Raw intervals are retained with the Phase 4 evidence; unsupported long-task APIs are null rather than claimed zero.

## Decision and order

Use a forced palette for dark mode and high contrast. Never put a colour filter on html, body, a layout container or the widget host. Colour rules live in the single owned document stylesheet, gated by html classes, screen media and forced-colors:none.

Palette rules override HTML backgrounds, text, borders, text decoration and shadows. Decorative CSS background images and gradients are removed to give text a known opaque surface. Replaced media, SVG/MathML and semantic image subtrees retain their original colours. Links remain visibly underlined; focus rings remain visible. Dark uses white on #121212 with light blue links. High contrast uses white on black with yellow links, and takes precedence over dark mode independently of toggle order.

For saturation modes, convert computed HTML colour paints to a deterministic luminance mix, and use background-only saturation blending for CSS images/gradients. This avoids filtering their containers. Only atomic replaced media and SVG receive saturation filters; no HTML layout ancestor does. Low saturation retains 35% chroma for parsed HTML paints and atomic media; monochrome retains zero and wins when both are selected. CSS background images/gradients use luminosity blending over an achromatic base in both saturation modes, so those backgrounds become fully achromatic even in low saturation. The original background-image declaration is never copied: this avoids re-emitting URLs or causing revalidation requests. Ordinary owner media filters are composed rather than discarded. Media with URL-bearing owner filters is left unchanged, because copying such a filter could revalidate its resource. Semantic HTML image subtrees are preserved rather than filtering a possible layout ancestor. Classification and generated rules must be reversible and refresh for dynamic owner changes.

Order: owner paints → selected palette (high contrast wins) → selected saturation (monochrome wins). Converting palette paints preserves white/black contrast. Saturation is an intentional media adjustment; dark/high contrast alone preserve media.

| Dark   | High contrast | Monochrome | Low saturation | Result                                              |
| ------ | ------------- | ---------- | -------------- | --------------------------------------------------- |
| off    | off           | off        | off            | Owner page                                          |
| on     | off           | off        | off            | Dark palette, natural media                         |
| either | on            | off        | off            | High-contrast palette, natural media                |
| either | either        | on         | either         | Selected palette/owner paints in monochrome         |
| either | either        | off        | on             | Selected palette/owner paints at reduced saturation |

All 16 boolean combinations are allowed; precedence above covers every combination, with no multiplicative saturation stacking. State persists even when the operating system suppresses the adjustments.

## Forced colours and print

Under forced-colors:active, no library colour rule applies. Do not opt host content out of system colours. The panel explains that operating-system colours control appearance. Under print, no library colour adjustment applies; original print/owner styles take effect. No global print reset overrides owner styling.

## Scope and limits

This is personalisation, not a conformance repair. Inline important styles and stronger author rules can resist overrides. Removing decorative backgrounds can remove icons conveyed only by backgrounds; semantic images are preserved, so text baked into those images is not recoloured. Canvas pixels, video frames, SVG artwork, iframe documents and closed shadow roots are not palette-rewritten. Cross-origin content remains its own document.

Saturation conversion supports computed RGB paint colours; background images and gradients use background-only blending without parsing or copying image URLs. Wide-gamut/other colour functions that cannot be safely parsed remain unchanged and are an explicit limitation. Owner background blend modes, image masks, CSS-in-JS/CSSOM mutations without observed events, pseudo-elements and sophisticated compositing may require host-specific integration. Contrast must be measured on the actual host; no universal 7:1 claim is made.

A native modal can make the rest of the document inert and cover the widget; the widget does not defeat that host interaction. Fixed/sticky anchoring must remain unchanged with selected adjustments, but independent owner transforms/filters can already alter their behavior. Early restoration requires loading after owner styles and before first paint; late initialization cannot undo an earlier flash.
