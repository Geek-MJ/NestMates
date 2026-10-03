import { useEffect } from 'react';
import { cameraAt, clamp01, presence, smoothstep } from '../motion/camera.js';

/** After this long without scrolling, the world is re-rasterized at its final scale. */
const SETTLE_MS = 160;

function chapterProgress(centre, chapter) {
  return clamp01((centre - chapter.top) / chapter.height);
}

/**
 * Drives the desktop journey from the scroll position without React re-renders.
 * Writes, on `root`: --lp-{id} (chapter progress), --vis-{id} (chapter presence), --open
 * (facade), --door, --walk, --focus (close-up amount), --S (world scale), --progress, and
 * data-scene (the dominant chapter). Moves `world` with the camera transform.
 */
export default function useJourneyScroll({ rootRef, worldRef, chaptersRef, scenes, enabled }) {
  useEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    const container = chaptersRef.current;
    if (!enabled || !root || !world || !container) return undefined;

    let metrics = null;
    let frame = 0;
    let listening = false;
    let settleTimer = 0;

    const measure = () => {
      const chapters = [...container.querySelectorAll('[data-chapter]')].map((element) => ({
        top: element.offsetTop,
        height: element.offsetHeight,
      }));
      metrics = {
        width: window.innerWidth,
        height: window.innerHeight,
        chapters,
        midpoints: chapters.map((chapter) => chapter.top + chapter.height / 2),
        total: container.offsetHeight,
      };
    };

    const update = () => {
      frame = 0;
      if (!metrics) measure();
      const { width, height, chapters, midpoints, total } = metrics;
      const centre = -root.getBoundingClientRect().top + height / 2;
      const style = root.style;

      let dominant = 0;
      let dominantPresence = -1;
      const progress = {};
      chapters.forEach((chapter, index) => {
        const { id } = scenes[index];
        const local = chapterProgress(centre, chapter);
        const visible = presence(local);
        progress[id] = local;
        style.setProperty(`--lp-${id}`, local.toFixed(4));
        style.setProperty(`--vis-${id}`, visible.toFixed(4));
        if (visible > dominantPresence) {
          dominantPresence = visible;
          dominant = index;
        }
      });

      const [arrival, enter] = chapters;
      const open = smoothstep(
        clamp01((centre - (arrival.top + arrival.height * 0.6)) / (enter.top + enter.height * 0.8 - (arrival.top + arrival.height * 0.6))),
      );
      const camera = cameraAt(centre, midpoints, scenes, width, height);

      world.style.transform = `translate3d(${camera.translateX.toFixed(2)}px, ${camera.translateY.toFixed(2)}px, 0) scale(${camera.scale.toFixed(5)})`;
      style.setProperty('--S', camera.scale.toFixed(5));
      style.setProperty('--focus', clamp01((camera.zoom - 1.2) / 0.7).toFixed(4));
      style.setProperty('--open', open.toFixed(4));
      style.setProperty('--door', clamp01(open * 3).toFixed(4));
      style.setProperty('--walk', smoothstep(clamp01(((progress.people ?? 0) - 0.3) / 0.45)).toFixed(4));
      style.setProperty('--progress', clamp01((centre - height / 2) / Math.max(1, total - height)).toFixed(4));

      const sceneId = scenes[dominant].id;
      if (root.dataset.scene !== sceneId) root.dataset.scene = sceneId;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Composited while moving (smooth), then re-rasterized when still (sharp at high zoom).
    const onScroll = () => {
      if (!settleTimer) world.style.willChange = 'transform';
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settleTimer = 0;
        world.style.willChange = '';
      }, SETTLE_MS);
      schedule();
    };

    const onResize = () => {
      measure();
      schedule();
    };

    const startListening = () => {
      if (listening) return;
      listening = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      schedule();
    };

    const stopListening = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener('scroll', onScroll);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) startListening();
      else stopListening();
    });
    visibility.observe(root);

    const sizes = new ResizeObserver(onResize);
    sizes.observe(container);
    window.addEventListener('resize', onResize, { passive: true });

    measure();
    update();

    return () => {
      visibility.disconnect();
      sizes.disconnect();
      stopListening();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      world.style.transform = '';
      world.style.willChange = '';
    };
  }, [rootRef, worldRef, chaptersRef, scenes, enabled]);
}
