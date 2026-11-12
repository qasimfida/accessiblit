// @vitest-environment node
import { expect, it } from 'vitest';
import { matchesShortcut } from '../../src/ui/keyboard';
function event(overrides: Partial<KeyboardEvent> = {}) {
  return {
    code: 'KeyA',
    key: 'q',
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    defaultPrevented: false,
    getModifierState: () => false,
    ...overrides,
  } as KeyboardEvent;
}
it('matches physical letter/digit codes with exact modifiers', () => {
  expect(matchesShortcut(event(), 'Alt+A')).toBe(true);
  expect(matchesShortcut(event({ key: 'a', code: 'KeyQ' }), 'Alt+A')).toBe(
    false,
  );
  expect(
    matchesShortcut(
      event({ code: 'Digit1', ctrlKey: true, altKey: false, shiftKey: true }),
      'Shift+Control+1',
    ),
  ).toBe(true);
  expect(
    matchesShortcut(event({ metaKey: true, altKey: false }), 'Meta+A'),
  ).toBe(true);
  for (const override of [
    { altKey: false },
    { ctrlKey: true },
    { shiftKey: true },
    { metaKey: true },
  ])
    expect(matchesShortcut(event(override), 'Alt+A')).toBe(false);
});
it('does not intercept disabled, repeated, composed, AltGraph or already-handled input', () => {
  expect(matchesShortcut(event(), false)).toBe(false);
  for (const override of [
    { repeat: true },
    { isComposing: true },
    { defaultPrevented: true },
    { getModifierState: () => true },
  ])
    expect(matchesShortcut(event(override), 'Alt+A')).toBe(false);
});
