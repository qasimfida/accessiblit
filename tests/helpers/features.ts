import type { Feature } from '../../src/core/types';

/** Test-only effects prove the runtime without shipping real catalogue features. */
export function testFeatures(): Feature[] {
  return [
    {
      id: 'fontSize',
      group: 'content',
      label: 'Test font size',
      description: 'Test scale',
      control: { type: 'range', min: 80, max: 200, step: 10 },
      apply(value, api) {
        api.styles.addRule(
          'html.accessiblit-test-font { font-size: calc(var(--accessiblit-test-size) * 1%); }',
        );
        api.styles.addClass('accessiblit-test-font');
        api.styles.setVariable('--accessiblit-test-size', String(value));
        return () => {};
      },
    },
    {
      id: 'darkMode',
      group: 'colour',
      label: 'Test dark mode',
      description: 'Test colour',
      control: { type: 'toggle' },
      apply(value, api) {
        if (!value) return () => {};
        api.styles.addRule(
          'html.accessiblit-test-dark { background: #111; color: #fff; }',
        );
        api.styles.addClass('accessiblit-test-dark');
        api.listen(api.document, 'accessiblit-test-event', () =>
          api.announce('Test event received'),
        );
        api.announce('Test dark mode enabled');
        return () => {};
      },
    },
  ];
}
