/** Desktop journey: wide enough, tall enough, and motion is welcome. */
export const IMMERSIVE_QUERY =
  '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

let finePointer;

/** Whether pointer-reactive effects should run (precise pointer, motion not reduced). */
export function prefersPointerEffects() {
  if (typeof window === 'undefined') return false;
  finePointer ??= window.matchMedia(FINE_POINTER_QUERY);
  return finePointer.matches;
}
