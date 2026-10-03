/**
 * The landing journey, in order. `length` is the chapter's scroll length in viewport heights.
 * `camera` frames the home on desktop: world point (x, y) shown at screen fraction (sx, sy),
 * with zoom z (1 = the whole home fits comfortably beside the text).
 */
export const SCENES = [
  { id: 'arrival', length: 100, camera: { x: 800, y: 455, z: 0.9, sx: 0.665, sy: 0.5 } },
  { id: 'enter', length: 110, camera: { x: 800, y: 770, z: 1.6, sx: 0.62, sy: 0.56 } },
  { id: 'people', length: 125, camera: { x: 800, y: 545, z: 1.02, sx: 0.64, sy: 0.53 } },
  { id: 'expenses', length: 110, module: 'expenses', camera: { x: 668, y: 740, z: 2.2, sx: 0.44, sy: 0.55 } },
  { id: 'calendar', length: 105, module: 'calendar', camera: { x: 452, y: 325, z: 2.2, sx: 0.44, sy: 0.5 } },
  { id: 'documents', length: 105, module: 'documents', camera: { x: 1066, y: 300, z: 2.05, sx: 0.44, sy: 0.5 } },
  { id: 'tasks', length: 105, module: 'tasks', camera: { x: 1322, y: 325, z: 2.2, sx: 0.44, sy: 0.5 } },
  { id: 'chat', length: 110, module: 'chat', camera: { x: 1058, y: 770, z: 2.15, sx: 0.44, sy: 0.55 } },
  { id: 'final', length: 100, camera: { x: 800, y: 470, z: 0.86, sx: 0.665, sy: 0.52 } },
];

export const FEATURE_SCENES = SCENES.filter((scene) => scene.module);

export const sceneIndex = (id) => SCENES.findIndex((scene) => scene.id === id);
