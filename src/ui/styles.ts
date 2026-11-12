import type { placeUI } from './placement';

/** Shadow-local tokens isolate typography and support system appearance without remote assets. */
export const UI_CSS = `
.accessiblit-surface {
  all:initial; --ui-bg:#ffffff; --ui-ink:#162b3d; --ui-muted:#42566c; --ui-border:#6b8094;
  --ui-quiet:#eef4fa; --ui-accent:#1456a0; --ui-accent-ink:#ffffff; --ui-focus:#1456a0;
  position:fixed; display:block; box-sizing:border-box; margin:0; padding:0;
  color:var(--ui-ink); background:var(--ui-bg); font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color-scheme:light dark; text-align:start; letter-spacing:normal; word-spacing:normal; text-transform:none; text-indent:0;
  pointer-events:auto; overflow-wrap:anywhere; animation:none; transition:none; scroll-behavior:auto;
}
.accessiblit-surface[hidden] { display:none!important; }
.accessiblit-surface *, .accessiblit-surface *::before, .accessiblit-surface *::after { box-sizing:border-box; letter-spacing:inherit; word-spacing:inherit; }
.accessiblit-surface button {
  appearance:none; font:inherit; color:var(--ui-ink); background:var(--ui-bg); border:1px solid var(--ui-border);
  border-radius:8px; min-inline-size:44px; min-block-size:44px; padding:8px 12px; cursor:pointer; text-align:center; overflow-wrap:anywhere;
}
.accessiblit-surface:focus, .accessiblit-surface :focus {
  outline:3px solid var(--ui-focus); outline-offset:3px; box-shadow:0 0 0 6px var(--ui-bg);
}
.accessiblit-surface button[aria-disabled=true] { color:var(--ui-muted); background:var(--ui-quiet); cursor:default; }
.accessiblit-launcher {
  display:flex; align-items:center; justify-content:center; inline-size:48px; block-size:48px; padding:0; border:2px solid var(--ui-accent);
  border-radius:50%; color:var(--ui-accent-ink); background:var(--ui-accent); box-shadow:0 4px 16px #12263833; cursor:pointer;
}
.accessiblit-launcher svg { display:block; flex:none; }
.accessiblit-panel { padding:16px; border:1px solid var(--ui-border); border-radius:16px; box-shadow:0 12px 40px #12263833; overflow:auto; overscroll-behavior:contain; scroll-padding:12px; }
.accessiblit-header { display:flex; align-items:flex-start; gap:12px; }
.accessiblit-header h2 { margin:0; flex:1; min-inline-size:0; font-size:20px; line-height:1.3; font-weight:700; }
.accessiblit-surface .accessiblit-close { flex:none; min-inline-size:64px; }
.accessiblit-intro { margin:12px 0 20px; color:var(--ui-muted); font-size:14px; line-height:1.5; }
.accessiblit-group { margin:0 0 20px; }
.accessiblit-group h3 { margin:0 0 12px; font-size:16px; line-height:1.5; font-weight:700; }
.accessiblit-feature { padding:12px 0; border-block-start:1px solid var(--ui-border); }
.accessiblit-feature h4 { margin:0; font-size:15px; font-weight:650; line-height:1.5; }
.accessiblit-feature p, .accessiblit-empty { margin:4px 0 12px; color:var(--ui-muted); font-size:14px; line-height:1.5; }
.accessiblit-surface .accessiblit-toggle { display:flex; align-items:center; justify-content:space-between; gap:12px; inline-size:100%; text-align:start; }
.accessiblit-badge { flex:none; border:1px solid var(--ui-border); border-radius:20px; padding:2px 10px; background:var(--ui-quiet); color:var(--ui-ink); font-size:14px; }
.accessiblit-toggle[aria-pressed=true] .accessiblit-badge { background:var(--ui-accent); color:var(--ui-accent-ink); border-color:var(--ui-accent); }
.accessiblit-value { display:block; margin-block:8px; font-weight:650; text-align:center; font-variant-numeric:tabular-nums; }
.accessiblit-stepper { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.accessiblit-surface .accessiblit-step { display:flex; align-items:center; justify-content:center; gap:6px; }
.accessiblit-options { display:grid; gap:6px; }
.accessiblit-choice { display:flex; gap:12px; align-items:center; padding:8px; min-block-size:44px; border:1px solid var(--ui-border); border-radius:8px; cursor:pointer; }
.accessiblit-choice input { flex:none; inline-size:24px; block-size:24px; margin:0; accent-color:var(--ui-accent); }
.accessiblit-choice span { min-inline-size:0; }
.accessiblit-surface .accessiblit-reset { inline-size:100%; font-weight:650; }
.accessiblit-surface button, .accessiblit-choice input { scroll-margin:12px; }
@media (prefers-color-scheme:dark) {
  .accessiblit-surface { --ui-bg:#142331; --ui-ink:#f5f8fc; --ui-muted:#c4d2e1; --ui-border:#91a8bc; --ui-quiet:#22384b; --ui-accent:#a5d0ff; --ui-accent-ink:#142331; --ui-focus:#a5d0ff; }
}
@media (prefers-reduced-motion:reduce) {
  .accessiblit-surface, .accessiblit-surface * { animation:none!important; transition:none!important; scroll-behavior:auto!important; }
}
.accessiblit-cursor-note { display:none; }
@media not all and (any-pointer:fine) { .accessiblit-cursor-note { display:block; } }
.accessiblit-forced-colours-note { display:none; }
@media (forced-colors:active) {
  .accessiblit-forced-colours-note,.accessiblit-cursor-note { display:block; }
  .accessiblit-surface { --ui-bg:Canvas; --ui-ink:CanvasText; --ui-muted:CanvasText; --ui-border:CanvasText; --ui-quiet:Canvas; --ui-accent:CanvasText; --ui-accent-ink:Canvas; --ui-focus:CanvasText; forced-color-adjust:auto; box-shadow:none; }
  .accessiblit-surface button, .accessiblit-launcher { background:Canvas; color:CanvasText; border-color:CanvasText; }
  .accessiblit-choice input { accent-color:auto; }
}
.accessiblit-surface::backdrop { background:transparent; pointer-events:none; }
`;

/** Numeric placement lives in the owned sheet rather than per-element inline style attributes. */
export function positionCSS(
  position: ReturnType<typeof placeUI>,
  zoom: number,
): string {
  return `.accessiblit-surface{z-index:${position.zIndex};zoom:${zoom}}
.accessiblit-launcher{inset-block-start:${position.launcherTop}px;inset-inline-start:${position.launcherLeft}px}
.accessiblit-launcher:dir(rtl){inset-inline-start:${position.layoutWidth - position.launcherLeft - 48}px}
.accessiblit-panel{inline-size:${position.panelWidth}px;max-block-size:${position.panelMaxHeight}px;inset-inline-start:${position.panelLeft}px;inset-block-start:${position.panelTop === undefined ? 'auto' : `${position.panelTop}px`};inset-block-end:${position.panelBottom === undefined ? 'auto' : `${position.panelBottom}px`}}
.accessiblit-panel:dir(rtl){inset-inline-start:${position.layoutWidth - position.panelLeft - position.panelWidth}px}`;
}
