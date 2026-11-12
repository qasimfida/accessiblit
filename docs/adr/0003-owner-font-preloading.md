# 0003 — Owner-loaded dyslexia fonts without widget requests

Status: Accepted; the human confirmed on 2026-11-13 that the owner preloads the font and the widget makes no font requests.

AGENTS.md section 2 prohibits runtime requests and remote fonts. The dyslexiaFontUrl option identifies an owner-provided source; it is not a loader instruction. Accessiblit never creates a FontFace, adds an @font-face rule, calls fonts.load or requests the URL.

The owner must register the font family **AccessiblitDyslexia** and load every declared face in that family before init. Matching is case-insensitive and all variants must have status loaded, so selecting a bold/italic variant cannot accidentally start a download. The widget reads FontFaceSet and listens for loadingdone; it does not initiate loading. Missing/blocked APIs or unavailable faces use the fallback and a bounded developer warning when an owner source was configured.

Owner code, outside the widget, can prepare a licensed font:

```js
const source = new URL('/fonts/reader.woff2', location.href).href;
const face = new FontFace('AccessiblitDyslexia', 'url("/fonts/reader.woff2")');
await face.load(); // Explicit owner action; never done by the widget.
document.fonts.add(face);
Accessiblit.init({ dyslexiaFontUrl: source });
```

An owner who registers an already-loaded face after init should reinitialize or toggle the font mode off/on. For first-paint custom typography, finish preparation before init; a late owner font can cause a font swap. Later owner changes to font registrations remain the owner's responsibility.

Readable mode uses `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Dyslexia mode uses the loaded owner alias followed by `ui-rounded, system-ui, sans-serif`, or that rounded system stack alone when unavailable. No font file is bundled. This fallback is a typography option, not a claim that one font helps every dyslexic reader.

Code/preformatted contexts and semantic graphics are excluded from font-family replacement. Original metadata, root variables/classes, sheets and listeners are restored on reset/destroy. Browser tests verify every mode and a local owner-loaded alias with zero requests to the configured remote reference.
