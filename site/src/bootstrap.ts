import type { init } from '@qasimfida/accessiblit';

declare const Accessiblit: { init: typeof init };

// A classic head script applies persisted preferences before the body is parsed.
const widget = Accessiblit.init();
document.addEventListener('accessiblit:open-demo', () => widget.open());
