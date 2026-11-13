import type { UIVIewport } from './placement';
interface ViewportSource {
  innerWidth: number;
  innerHeight: number;
  visualViewport?: Pick<
    VisualViewport,
    'width' | 'height' | 'offsetLeft' | 'offsetTop'
  > | null;
}
/** Cache the fixed inline viewport basis so unrelated host style changes do not force layout. */
export function createViewportReader(
  root: () => Pick<Element, 'clientWidth'> | null,
  view: ViewportSource,
): () => UIVIewport {
  let signature = '',
    layoutWidth = 0;
  return () => {
    const visual = view.visualViewport;
    const next = `${view.innerWidth}/${visual?.width ?? 'none'}`;
    if (next !== signature) {
      // Mobile innerWidth may include RTL overflow; fixed logical insets use the root viewport.
      layoutWidth = root()?.clientWidth || view.innerWidth;
      signature = next;
    }
    return {
      width: visual?.width ?? layoutWidth,
      height: visual?.height ?? view.innerHeight,
      left: visual?.offsetLeft ?? 0,
      top: visual?.offsetTop ?? 0,
      layoutWidth,
      layoutHeight: view.innerHeight,
    };
  };
}
