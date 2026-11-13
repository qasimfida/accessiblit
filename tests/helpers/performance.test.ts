import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { measureTransitions } from '../../e2e/helpers/performance';
import { DEFAULT_STATE } from '../../src/core/schema';
import type { AccessiblitInstance } from '../../src/core/types';

let clock = 0;
let frames: FrameRequestCallback[];
let change: ReturnType<typeof vi.fn<AccessiblitInstance['setFeature']>>;

beforeEach(() => {
  clock = 0;
  frames = [];
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  change = vi.fn<AccessiblitInstance['setFeature']>(() => {
    clock += 2;
  });
  window.contentInstance = {
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    reset: vi.fn(),
    getState: () => ({ ...DEFAULT_STATE }),
    setFeature: change,
    destroy: vi.fn(),
  };
});

afterEach(() => {
  document.body.replaceChildren();
  Reflect.deleteProperty(window, 'contentInstance');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function host(count: number) {
  const main = document.createElement('main');
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) fragment.append(document.createElement('p'));
  main.append(fragment);
  document.body.append(main);
}

it('charges every operation and its next callback, while separating previous frame work', async () => {
  host(5000);
  const measured = measureTransitions({ id: 'fontSize', values: [120, 140] });
  async function frame(elapsed: number) {
    clock += elapsed;
    const callback = frames.shift();
    expect(callback).toBeTypeOf('function');
    callback!(clock);
    await Promise.resolve();
  }
  expect(change).not.toHaveBeenCalled();
  await frame(40);
  expect(change).not.toHaveBeenCalled();
  await frame(60);
  expect(change.mock.calls).toEqual([['fontSize', 120]]);
  await frame(8);
  await frame(50);
  expect(change).toHaveBeenCalledTimes(1);
  await frame(50);
  expect(change.mock.calls).toEqual([
    ['fontSize', 120],
    ['fontSize', 140],
  ]);
  await frame(8);
  expect(await measured).toEqual([
    { value: 120, synchronous: 2, nextFrame: 10, baselineSettling: 100 },
    { value: 140, synchronous: 2, nextFrame: 10, baselineSettling: 100 },
  ]);
  expect(frames).toHaveLength(0);
});

it.each([0, 4999, 5001])(
  'rejects an incorrect %i-element workload',
  async (count) => {
    host(count);
    await expect(
      measureTransitions({ id: 'fontSize', values: [120] }),
    ).rejects.toThrow('exactly 5000');
    expect(change).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  },
);

it('rejects a missing host before scheduling measurements', async () => {
  await expect(
    measureTransitions({ id: 'fontSize', values: [120] }),
  ).rejects.toThrow('exactly 5000');
  expect(frames).toHaveLength(0);
});
