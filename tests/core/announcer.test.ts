import { afterEach, expect, it, vi } from 'vitest';
import { createAnnouncer } from '../../src/core/announcer';
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('announces safely, repeats messages and bounds text in a polite atomic live region', () => {
  vi.useFakeTimers();
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const announcer = createAnnouncer(root, 'owner-nonce');
  const region = root.querySelector('[role=status]')!;
  expect(region.getAttribute('aria-live')).toBe('polite');
  expect(region.getAttribute('aria-atomic')).toBe('true');
  expect(root.querySelector('style')?.nonce).toBe('owner-nonce');
  announcer.announce('<script>no markup</script>');
  expect(region.textContent).toBe('');
  vi.runAllTimers();
  expect(region.textContent).toBe('<script>no markup</script>');
  expect(region.querySelector('script')).toBeNull();
  announcer.announce('Same');
  vi.runAllTimers();
  announcer.announce('Same');
  expect(region.textContent).toBe('');
  vi.runAllTimers();
  expect(region.textContent).toBe('Same');
  announcer.announce('superseded');
  announcer.announce('x'.repeat(1000));
  expect(vi.getTimerCount()).toBe(1);
  vi.runAllTimers();
  expect(region.textContent?.length).toBe(512);
  announcer.announce('');
  expect(region.textContent).toBe('');
  announcer.announce(1 as unknown as string);
  expect(vi.getTimerCount()).toBe(0);
  announcer.destroy();
  expect(root.childNodes).toHaveLength(0);
});
it('cancels pending announcements and stays inert after teardown', () => {
  vi.useFakeTimers();
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const a = createAnnouncer(root);
  a.announce('pending');
  a.destroy();
  a.destroy();
  a.announce('late');
  expect(vi.getTimerCount()).toBe(0);
  vi.runAllTimers();
  expect(root.childNodes).toHaveLength(0);
});
it('rolls back failed setup', () => {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  vi.spyOn(root, 'appendChild').mockImplementationOnce(() => {
    throw new Error('host');
  });
  expect(() => createAnnouncer(root)).toThrow('host');
  expect(root.childNodes).toHaveLength(0);
});
