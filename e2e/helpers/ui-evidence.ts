import type { Page } from '@playwright/test';

/** Inspect rendered values instead of inferring contrast, target size or reflow from source tokens. */
export async function uiEvidence(page: Page) {
  return page.locator('[data-accessiblit-host]').evaluate((host) => {
    const root = host.shadowRoot!;
    const panel = root.querySelector<HTMLElement>('[role=dialog]')!;
    type Color = { r: number; g: number; b: number; a: number };
    function color(value: string): Color {
      if (!value.startsWith('rgb'))
        throw new Error(`Unexpected computed color: ${value}`);
      const parts = value.match(/[\d.]+/g)!.map(Number);
      return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
    }
    function background(element: Element): Color {
      for (
        let current: Element | null = element;
        current;
        current = current.parentElement
      ) {
        const fill = color(getComputedStyle(current).backgroundColor);
        if (fill.a >= 0.99) return fill;
      }
      throw new Error('No opaque surface behind UI text');
    }
    function luminance(value: Color): number {
      const channels = [value.r, value.g, value.b].map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return (
        channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
      );
    }
    function contrast(a: Color, b: Color): number {
      const first = luminance(a),
        second = luminance(b);
      return (
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
      );
    }
    const visible = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return (
        bounds.width > 0 &&
        bounds.height > 0 &&
        getComputedStyle(element).visibility !== 'hidden'
      );
    };
    const targets = [...root.querySelectorAll<HTMLElement>('button,input')]
      .filter(visible)
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          name:
            element.getAttribute('aria-label') ??
            element.textContent ??
            element.tagName,
          width: box.width,
          height: box.height,
        };
      });
    const text = [...root.querySelectorAll<HTMLElement>('.accessiblit-panel *')]
      .filter(
        (element) =>
          visible(element) &&
          [...element.childNodes].some(
            (node) =>
              node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim(),
          ) &&
          element.getAttribute('aria-disabled') !== 'true',
      )
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent?.trim(),
          foreground: style.color,
          background: getComputedStyle(element).backgroundColor,
          ratio: contrast(color(style.color), background(element)),
        };
      });
    const focused = root.activeElement as HTMLElement | null;
    const boundaries = [
      ...root.querySelectorAll<HTMLElement>(
        '.accessiblit-panel,.accessiblit-panel button,.accessiblit-choice',
      ),
    ].map((element) => ({
      name: element.getAttribute('aria-label') ?? element.className,
      ratio: contrast(
        color(getComputedStyle(element).borderTopColor),
        background(element),
      ),
    }));
    const focus = focused
      ? {
          width: parseFloat(getComputedStyle(focused).outlineWidth),
          style: getComputedStyle(focused).outlineStyle,
          ratio: contrast(
            color(getComputedStyle(focused).outlineColor),
            background(focused),
          ),
        }
      : null;
    const launcher = root.querySelector<HTMLElement>('.accessiblit-launcher')!;
    const iconRatio = contrast(
      color(getComputedStyle(launcher).color),
      background(launcher),
    );
    const box = panel.getBoundingClientRect();
    return {
      targets,
      text,
      boundaries,
      focus,
      iconRatio,
      panel: {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
        scrollWidth: panel.scrollWidth,
        clientWidth: panel.clientWidth,
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight,
      },
      documentOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  });
}
