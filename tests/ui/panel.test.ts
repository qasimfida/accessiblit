import { afterEach, expect, it, vi } from 'vitest';
import { createPanel } from '../../src/ui/panel';
import { resolveOptions } from '../../src/core/options';
import { createState } from '../../src/core/schema';
import { testFeatures } from '../helpers/features';
import type { Feature } from '../../src/core/types';
const releases: (() => void)[] = [];
afterEach(() => {
  releases.forEach((fn) => fn());
  releases.length = 0;
  vi.restoreAllMocks();
});
it('generates all three control kinds and stable non-modal grouping from metadata', () => {
  const radio = {
    ...testFeatures()[0],
    id: 'textAlign',
    label: 'Text alignment',
    control: {
      type: 'select',
      values: ['off', 'left'],
      labels: ['Off', 'Left'],
    },
  } as Feature;
  const nav = {
    ...testFeatures()[1],
    id: 'focusHighlight',
    group: 'navigation',
    label: 'Focus indicator',
  } as Feature;
  const state = createState();
  const actions = {
    getState: () => ({ ...state }),
    setFeature: vi.fn((id, value) => {
      state[id as keyof typeof state] = value;
      panel.update(state);
    }),
    close: vi.fn(),
    reset: vi.fn(),
  };
  const panel = createPanel(
    document,
    [...testFeatures(), radio, nav],
    resolveOptions().messages,
    'panel',
    actions,
  );
  releases.push(panel.destroy);
  document.body.append(panel.element);
  expect(panel.element.getAttribute('role')).toBe('dialog');
  expect(panel.element.getAttribute('aria-modal')).toBe('false');
  expect(panel.element.hidden).toBe(true);
  expect(panel.element.getAttribute('aria-label')).toBe(
    'Accessibility options',
  );
  expect(panel.element.querySelector('h2')?.textContent).toBe(
    'Accessibility options',
  );
  expect(
    [...panel.element.querySelectorAll('h3')].map((e) => e.textContent),
  ).toEqual(['Content', 'Colour and contrast', 'Navigation and orientation']);
  expect(panel.element.querySelectorAll('.accessiblit-feature')).toHaveLength(
    4,
  );
  const toggle = panel.element.querySelector(
    '[aria-pressed]',
  ) as HTMLButtonElement;
  toggle.click();
  expect(actions.setFeature).toHaveBeenCalledWith('darkMode', true);
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  const option = panel.element.querySelectorAll('input')[1]!;
  option.click();
  expect(actions.setFeature).toHaveBeenCalledWith('textAlign', 'left');
  panel.closeButton.click();
  panel.resetButton.click();
  expect(actions.close).toHaveBeenCalledTimes(1);
  expect(actions.reset).toHaveBeenCalledTimes(1);
  panel.destroy();
  panel.update(createState());
  panel.closeButton.click();
  expect(actions.close).toHaveBeenCalledTimes(1);
  expect(panel.element.isConnected).toBe(false);
});
it('reports unavailable groups and isolates malformed control metadata', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const [font, dark] = testFeatures() as [Feature, Feature];
  const broken = {
    ...font,
    control: { type: 'missing' },
  } as unknown as Feature;
  const actions = {
    getState: createState,
    setFeature: vi.fn(),
    close: vi.fn(),
    reset: vi.fn(),
  };
  const empty = createPanel(
    document,
    [],
    resolveOptions().messages,
    'empty',
    actions,
  );
  releases.push(empty.destroy);
  expect(empty.element.querySelectorAll('.accessiblit-empty')).toHaveLength(3);
  const panel = createPanel(
    document,
    [broken, dark, dark],
    resolveOptions().messages,
    'safe',
    actions,
  );
  releases.push(panel.destroy);
  expect(panel.element.querySelectorAll('[aria-pressed]')).toHaveLength(1);
  expect(console.warn).toHaveBeenCalledTimes(1);
});

it('includes a translatable operating-system colour explanation', () => {
  const panel = createPanel(
    document,
    [],
    {
      ...resolveOptions().messages,
      forcedColoursNote: 'System colours control this page.',
    },
    'note',
    {
      getState: createState,
      setFeature: () => {},
      close: () => {},
      reset: () => {},
    },
  );
  releases.push(panel.destroy);
  expect(
    panel.element.querySelector('.accessiblit-forced-colours-note')
      ?.textContent,
  ).toBe('System colours control this page.');
  expect(panel.element.querySelectorAll('.accessiblit-empty')).toHaveLength(3);
});

it('renders a device note from metadata without knowing a feature id', () => {
  const feature = { ...testFeatures()[0]!, requiresFinePointer: true };
  const panel = createPanel(
    document,
    [feature],
    resolveOptions().messages,
    'device',
    {
      getState: createState,
      setFeature: () => {},
      close: () => {},
      reset: () => {},
    },
  );
  releases.push(panel.destroy);
  expect(
    panel.element.querySelector('.accessiblit-cursor-note')?.textContent,
  ).toContain('mouse or trackpad');
});
