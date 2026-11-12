import { controlShell, makeButton } from './presentation';
import type { ControlContext, RenderedControl } from './control-types';

/** A stable button name plus aria-pressed exposes state without color-only cues. */
export function createToggle(context: ControlContext): RenderedControl {
  const shell = controlShell(context);
  const button = makeButton(context.document, '');
  button.className = 'accessiblit-toggle';
  button.setAttribute('aria-labelledby', shell.labelId);
  button.setAttribute('aria-describedby', shell.descriptionId);
  const label = context.document.createElement('span');
  label.textContent = shell.text.label;
  const badge = context.document.createElement('span');
  badge.setAttribute('aria-hidden', 'true');
  badge.className = 'accessiblit-badge';
  button.append(label, badge);
  shell.element.append(button);
  shell.scope.listen(button, 'click', () =>
    context.setValue(context.getValue() !== true),
  );
  const update = (value: unknown) => {
    if (!shell.scope.active) return;
    button.setAttribute('aria-pressed', String(value === true));
    badge.textContent =
      value === true ? context.messages.on : context.messages.off;
  };
  update(context.getValue());
  return { element: shell.element, update, destroy: shell.scope.dispose };
}
