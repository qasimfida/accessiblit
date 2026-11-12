import { createReporter } from './diagnostics';
import { createScope } from './scope';
import { createSheet } from './sheet';

/** Classes and variables compose by ownership and restore pre-existing root attributes. */
export function createStyles(doc: Document, nonce?: string) {
  const root = doc.documentElement;
  const original = {
    class: root.getAttribute('class'),
    style: root.getAttribute('style'),
  };
  const classTokens = [...root.classList].join(' ');
  const cssText = root.style.cssText;
  const sheet = createSheet(doc, nonce);
  const report = createReporter();
  const scope = createScope(() =>
    report('cleanup', 'A page style cleanup failed.'),
  );
  const rules = new Map<symbol, string>();
  const classes = new Map<string, { count: number; present: boolean }>();
  const variables = new Map<
    string,
    { value: string; priority: string; entries: { value: string }[] }
  >();
  let active = true;
  const render = () => sheet.set([...rules.values()].join('\n'));
  return {
    addRule(css: string) {
      if (!active) return () => {};
      const token = Symbol();
      rules.set(token, css);
      const release = scope.add(() => {
        rules.delete(token);
        render();
      });
      try {
        render();
      } catch (error) {
        release();
        throw error;
      }
      return release;
    },
    addClass(name: string) {
      if (!active || !/^accessiblit-[a-z0-9-]+$/.test(name)) return () => {};
      let entry = classes.get(name);
      if (!entry) {
        entry = { count: 0, present: root.classList.contains(name) };
        classes.set(name, entry);
      }
      entry.count++;
      root.classList.add(name);
      const owned = entry;
      return scope.add(() => {
        owned.count--;
        if (!owned.count) {
          if (!owned.present) root.classList.remove(name);
          classes.delete(name);
        }
      });
    },
    setVariable(name: string, value: string) {
      if (!active || !/^--accessiblit-[a-z0-9-]+$/.test(name)) return () => {};
      let entry = variables.get(name);
      if (!entry) {
        entry = {
          value: root.style.getPropertyValue(name),
          priority: root.style.getPropertyPriority(name),
          entries: [],
        };
        variables.set(name, entry);
      }
      const token = { value };
      entry.entries.push(token);
      root.style.setProperty(name, value);
      const owned = entry;
      return scope.add(() => {
        owned.entries.splice(owned.entries.indexOf(token), 1);
        const top = owned.entries[owned.entries.length - 1];
        if (top) root.style.setProperty(name, top.value);
        else {
          if (owned.value)
            root.style.setProperty(name, owned.value, owned.priority);
          else root.style.removeProperty(name);
          variables.delete(name);
        }
      });
    },
    destroy(): void {
      if (!active) return;
      active = false;
      scope.dispose();
      sheet.destroy();
      // CSSOM normalizes whitespace; preserve exact original serialization when no host edits remain.
      if ([...root.classList].join(' ') === classTokens) {
        if (original.class === null) root.removeAttribute('class');
        else root.setAttribute('class', original.class);
      }
      if (root.style.cssText === cssText) {
        if (original.style === null) {
          // Flush lazy CSSOM serialization before removal, or browsers can recreate an empty attribute.
          if (root.getAttribute('style') !== null)
            root.removeAttribute('style');
        } else root.setAttribute('style', original.style);
      }
    },
  };
}

/** Lets registry scopes expose only the reversible page-style API. */
export type StyleManager = ReturnType<typeof createStyles>;
