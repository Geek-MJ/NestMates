import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element is on screen. `seen` stays true after the first appearance
 * (for one-time reveals); `inView` follows the element (for pausing ambient animation).
 */
export default function useInView({ rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [state, setState] = useState({ inView: false, seen: typeof IntersectionObserver === 'undefined' });

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setState((previous) =>
          previous.inView === entry.isIntersecting && (previous.seen || !entry.isIntersecting)
            ? previous
            : { inView: entry.isIntersecting, seen: previous.seen || entry.isIntersecting },
        );
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return [ref, state.inView, state.seen];
}
