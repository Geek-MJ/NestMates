/** Element id of a chapter of the landing story. */
export const sceneElementId = (sceneId) => `scene-${sceneId}`;

/** Scrolls to a chapter and moves keyboard focus to its heading. */
export function goToScene(sceneId) {
  const section = document.getElementById(sceneElementId(sceneId));
  if (!section) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  section.querySelector('h1, h2')?.focus({ preventScroll: true });
}
