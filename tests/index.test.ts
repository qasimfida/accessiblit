import { afterEach, describe, expect, it, vi } from 'vitest';
import { destroy, init } from '../src/index';

describe('Phase 0 API contract', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('exposes an explicit placeholder for initialization', () => {
    expect(() => init()).toThrow('not implemented');
  });

  it('returns an inert instance when a DOM is unavailable', () => {
    vi.stubGlobal('document', undefined);
    const instance = init();
    expect(instance.getState()).toHaveProperty('fontSize', undefined);
    expect(() => {
      instance.open();
      instance.close();
      instance.toggle();
      instance.reset();
      instance.setFeature('fontSize', 120);
      instance.destroy();
    }).not.toThrow();
  });

  it('allows teardown before initialization', () => {
    expect(() => destroy()).not.toThrow();
  });
});
