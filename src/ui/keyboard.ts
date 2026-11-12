/** Physical codes keep modifier shortcuts stable across keyboard layouts and IME input. */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string | false,
): boolean {
  if (
    shortcut === false ||
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.getModifierState('AltGraph')
  )
    return false;
  const parts = shortcut.split('+');
  const key = parts.pop()!.toUpperCase();
  const modifiers = new Set(parts);
  const code = /^[0-9]$/.test(key) ? `Digit${key}` : `Key${key}`;
  return (
    event.code === code &&
    event.altKey === modifiers.has('Alt') &&
    event.ctrlKey === modifiers.has('Control') &&
    event.metaKey === modifiers.has('Meta') &&
    event.shiftKey === modifiers.has('Shift')
  );
}
