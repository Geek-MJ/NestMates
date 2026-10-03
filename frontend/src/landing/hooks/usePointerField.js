import { useEffect } from 'react';
import { FINE_POINTER_QUERY } from '../../utils/media.js';

/**
 * Publishes the pointer position on `ref` as CSS variables, at most once per frame:
 * --mx / --my in pixels and --px / --py from -1 to 1 (from the centre). Coordinates are
 * relative to the element, or to the viewport with `space: 'viewport'` (for sticky stages).
 * Only for precise pointers and when motion is welcome; otherwise nothing is written.
 */
export default function usePointerField(ref, { enabled = true, space = 'element' } = {}) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || !window.matchMedia(FINE_POINTER_QUERY).matches) return undefined;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      frame = 0;
      const rect =
        space === 'viewport'
          ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
          : element.getBoundingClientRect();
      const x = pointerX - rect.left;
      const y = pointerY - rect.top;
      element.style.setProperty('--mx', `${x.toFixed(1)}px`);
      element.style.setProperty('--my', `${y.toFixed(1)}px`);
      element.style.setProperty('--px', ((x / rect.width) * 2 - 1).toFixed(3));
      element.style.setProperty('--py', ((y / rect.height) * 2 - 1).toFixed(3));
    };

    const onMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };

    element.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      element.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled, space]);
}
