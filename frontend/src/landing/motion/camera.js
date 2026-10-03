import { WORLD_HEIGHT } from '../world/HomeScene.jsx';

/** Share of the space between two chapter centres during which the camera stays still. */
const HOLD = 0.24;
/** How much the camera pulls back while travelling between two close-ups. */
const TRAVEL_DIP = 0.14;

export const clamp01 = (value) => Math.min(1, Math.max(0, value));
export const smoothstep = (value) => value * value * (3 - 2 * value);
const lerp = (from, to, t) => from + (to - from) * t;

/** Eased 0–1 with rests at both ends, so the camera settles while a chapter's text is read. */
export function plateau(t, hold = HOLD) {
  return smoothstep(clamp01((t - hold) / (1 - hold * 2)));
}

/** Presence of a chapter (0–1) from its local progress: fades in, holds, fades out. */
export function presence(progress) {
  return smoothstep(clamp01(progress / 0.24)) * (1 - smoothstep(clamp01((progress - 0.76) / 0.24)));
}

/** Pixel scale at which the home, at zoom 1, fits beside the chapter text. */
export function baseScale(viewportWidth, viewportHeight) {
  return Math.min((viewportWidth * 0.58) / 1400, (viewportHeight * 0.8) / (WORLD_HEIGHT - 80));
}

/**
 * Camera for a scroll position. `centre` is the viewport centre in journey coordinates and
 * `midpoints` the centre of each chapter. Returns the world transform and the current zoom.
 */
export function cameraAt(centre, midpoints, scenes, viewportWidth, viewportHeight) {
  const last = scenes.length - 1;
  let index = 0;
  while (index < last && centre > midpoints[index + 1]) index += 1;

  const from = scenes[index].camera;
  const to = scenes[Math.min(index + 1, last)].camera;
  const t = index === last ? 0 : plateau(clamp01((centre - midpoints[index]) / (midpoints[index + 1] - midpoints[index])));

  const dip = from.z > 1.4 && to.z > 1.4 ? TRAVEL_DIP * Math.sin(Math.PI * t) : 0;
  const zoom = Math.exp(lerp(Math.log(from.z), Math.log(to.z), t)) * (1 - dip);
  const scale = baseScale(viewportWidth, viewportHeight) * zoom;
  const x = lerp(from.x, to.x, t);
  const y = lerp(from.y, to.y, t);

  return {
    zoom,
    scale,
    translateX: lerp(from.sx, to.sx, t) * viewportWidth - x * scale,
    translateY: lerp(from.sy, to.sy, t) * viewportHeight - y * scale,
  };
}
