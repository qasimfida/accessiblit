import { afterEach, expect, it, vi } from 'vitest';
import { createRegistry } from '../../src/core/registry';
import { createStyles } from '../../src/core/styles';
import { testFeatures } from '../helpers/features';
import type { Feature, FeatureId, FeatureApi } from '../../src/core/types';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.reverse().forEach((fn) => fn());
  cleanups.length = 0;
  vi.restoreAllMocks();
});
function setup() {
  const styles = createStyles(document);
  const announce = vi.fn();
  const registry = createRegistry(document, styles, announce);
  cleanups.push(() => {
    registry.destroy();
    styles.destroy();
  });
  return { registry, announce, styles };
}
it('registers, enables, updates and disables independently', () => {
  const { registry, announce } = setup();
  const [font, dark] = testFeatures() as [Feature, Feature];
  const apply = vi.spyOn(font, 'apply');
  registry.register(font);
  registry.register(dark);
  expect(registry.list()).toEqual([font, dark]);
  registry.enable('fontSize', 120);
  registry.enable('fontSize', 120);
  expect(apply).toHaveBeenCalledTimes(1);
  registry.enable('darkMode', true);
  document.dispatchEvent(new Event('accessiblit-test-event'));
  expect(announce).toHaveBeenLastCalledWith('Test event received');
  registry.enable('fontSize', 140);
  expect(
    document.documentElement.style.getPropertyValue('--accessiblit-test-size'),
  ).toBe('140');
  registry.disable('fontSize');
  expect(
    document.documentElement.classList.contains('accessiblit-test-dark'),
  ).toBe(true);
  registry.enable('darkMode', false);
  registry.disable('missing' as FeatureId);
  registry.enable('readingGuide', true);
  registry.enable('fontSize', 105);
  expect(apply).toHaveBeenCalledTimes(2);
  expect(
    document.documentElement.classList.contains('accessiblit-test-font'),
  ).toBe(false);
});
it('rolls back a partial throwing apply, logs once, and continues healthy features', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { registry } = setup();
  const [font, dark] = testFeatures() as [Feature, Feature];
  const listener = vi.fn();
  const release = vi.fn();
  font.apply = (_, api) => {
    api.styles.addClass('accessiblit-partial');
    api.styles.setVariable('--accessiblit-partial', '1');
    api.styles.addRule('html{}');
    api.listen(document, 'partial', listener);
    api.onCleanup(release);
    throw new Error('feature');
  };
  registry.register(font);
  registry.register(dark);
  registry.enable('fontSize', 120);
  registry.enable('fontSize', 130);
  registry.enable('darkMode', true);
  document.dispatchEvent(new Event('partial'));
  expect(listener).not.toHaveBeenCalled();
  expect(release).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(
    document.documentElement.classList.contains('accessiblit-partial'),
  ).toBe(false);
  expect(
    document.documentElement.style.getPropertyValue('--accessiblit-partial'),
  ).toBe('');
  expect(
    document.documentElement.classList.contains('accessiblit-test-dark'),
  ).toBe(true);
});
it('contains cleanup failures and invalid contracts and replaces registrations safely', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { registry } = setup();
  const [font] = testFeatures() as [Feature];
  font.apply = () => () => {
    throw new Error('cleanup');
  };
  registry.register(font);
  registry.enable('fontSize', 120);
  registry.register({ ...font, apply: () => undefined } as unknown as Feature);
  registry.enable('fontSize', 130);
  expect(warn).toHaveBeenCalledTimes(1);
  registry.register({ ...font, id: 'bad' } as unknown as Feature);
  registry.register({ ...font, apply: null } as unknown as Feature);
  expect(warn).toHaveBeenCalledTimes(2);
  registry.destroy();
  registry.destroy();
  registry.register(font);
  registry.enable('fontSize', 120);
  expect(registry.list()).toEqual([]);
});

it('recovers from a failed stylesheet append without retaining the failed rule', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { registry } = setup();
  const [font, dark] = testFeatures() as [Feature, Feature];
  font.apply = (_, api) => {
    api.styles.addRule('html { --failed-rule: 1 }');
    return () => {};
  };
  vi.spyOn(document.head, 'appendChild').mockImplementationOnce(() => {
    throw new Error('append failed');
  });
  registry.register(font);
  registry.register(dark);
  registry.enable('fontSize', 120);
  registry.enable('darkMode', true);
  const css = document.head.querySelector(
    '[data-accessiblit-style]',
  )?.textContent;
  expect(css).toContain('accessiblit-test-dark');
  expect(css).not.toContain('--failed-rule');
});

it('commits announcements only after successful apply and suppresses stale feature APIs', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { registry, announce } = setup();
  const [font] = testFeatures() as [Feature];
  let captured: FeatureApi | undefined;
  font.apply = (_, api) => {
    captured = api;
    api.announce('failed message');
    throw new Error('apply');
  };
  registry.register(font);
  registry.enable('fontSize', 120);
  expect(announce).not.toHaveBeenCalled();
  captured!.announce('late failed message');
  expect(announce).not.toHaveBeenCalled();
  font.apply = (_, api) => {
    captured = api;
    api.announce('first');
    api.announce('committed');
    return () => api.announce('cleanup');
  };
  registry.register(font);
  registry.enable('fontSize', 130);
  expect(announce).toHaveBeenCalledExactlyOnceWith('committed');
  captured!.announce('live');
  registry.disable('fontSize');
  captured!.announce('late');
  expect(announce.mock.calls).toEqual([['committed'], ['live']]);
  font.apply = (_, api) => {
    api.announce('cancelled');
    registry.disable('fontSize');
    return () => {};
  };
  registry.register(font);
  registry.enable('fontSize', 140);
  expect(announce).toHaveBeenCalledTimes(2);
});
