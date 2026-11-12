import { testFeatures } from './features';
import type { Feature } from '../../src/core/types';

/** A development-only catalogue exercises every renderer and group, without production placeholders. */
export function panelFeatures(): Feature[] {
  const [font, dark] = testFeatures() as [Feature, Feature];
  return [
    {
      ...font,
      label: 'Font size',
      description: 'Change the size of page text.',
      control: { type: 'range', min: 80, max: 200, step: 10, unit: 'percent' },
    },
    { ...dark, label: 'Dark mode', description: 'Use a dark page background.' },
    {
      id: 'textAlign',
      group: 'content',
      label: 'Text alignment',
      description: 'Align page text blocks.',
      control: {
        type: 'select',
        values: ['off', 'left', 'center', 'right'],
        labels: ['Off', 'Left', 'Center', 'Right'],
      },
      apply: () => () => {},
    },
    {
      id: 'focusHighlight',
      group: 'navigation',
      label: 'Focus highlight',
      description: 'Emphasize the current keyboard focus.',
      control: { type: 'toggle' },
      apply: () => () => {},
    },
  ];
}
