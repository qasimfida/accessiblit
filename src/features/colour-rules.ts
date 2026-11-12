import { ROOT_SELECTOR } from './dom';
/** Screen-only effects defer to owner print styles and operating-system forced colours. */
export const COLOUR_MEDIA = '@media screen and (forced-colors:none)';
/** Atomic media can be filtered without changing a page layout ancestor's containing block. */
export const COLOUR_MEDIA_ELEMENTS =
  'img,video,canvas,iframe,svg,math,object,embed';
/** Preserve artwork and widget internals rather than recolouring their internal surfaces. */
export const COLOUR_CONTENT =
  ':where(body,body *):not(:where(script,style,noscript,template,svg,svg *,math,math *,img,video,canvas,canvas *,iframe,object,embed,[role~="img"],[role~="img"] *,[data-accessiblit-host],[data-accessiblit-host] *))';
/** Separate variable names and a selector guard make palette precedence independent of activation order. */
export function paletteRules(kind: 'dark' | 'contrast'): string {
  const root = `${ROOT_SELECTOR}.accessiblit-${kind === 'dark' ? 'dark-mode:not(.accessiblit-high-contrast)' : 'high-contrast'}`;
  const ink = `var(--accessiblit-${kind}-ink)`,
    bg = `var(--accessiblit-${kind}-bg)`,
    link = `var(--accessiblit-${kind}-link)`;
  return `${COLOUR_MEDIA}{
${root}{color-scheme:dark!important;background:${bg}!important;color:${ink}!important}
${root} ${COLOUR_CONTENT}{color:${ink}!important;background-color:${bg}!important;background-image:none!important;border-color:${ink}!important;outline-color:${ink}!important;text-decoration-color:currentColor!important;text-shadow:none!important;box-shadow:none!important;accent-color:${link}!important}
${root} :where(a,a *){color:${link}!important;text-decoration-line:underline!important}
${root} :where(input,textarea)::placeholder{color:${ink}!important;opacity:1!important}
}`;
}
