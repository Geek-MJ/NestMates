import { useEffect, useRef, useState } from 'react';

/** Reports when an element first scrolls into view, for gentle scroll-based reveals. */
export default function useReveal({ rootMargin = '0px 0px -8% 0px', threshold = 0.1 } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed, rootMargin, threshold]);

  return [ref, revealed];
}
