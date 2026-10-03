/** Where things are in the home, in world coordinates (viewBox 0 0 1600 1000). */

/** Outline drawn around the object a feature chapter is about. */
export const FOCUS = {
  expenses: { x: 556, y: 628, width: 228, height: 200 },
  calendar: { x: 372, y: 236, width: 164, height: 178 },
  documents: { x: 956, y: 198, width: 244, height: 92 },
  tasks: { x: 1230, y: 238, width: 184, height: 176 },
  chat: { x: 1024, y: 752, width: 68, height: 72 },
};

/** Residents, for the labels of the "people" chapter (point above the head). */
export const RESIDENTS = [
  { role: 'cooking', x: 384, y: 690 },
  { role: 'working', x: 1118, y: 322 },
  { role: 'relaxing', x: 1058, y: 690 },
  { role: 'groceries', x: 900, y: 684, walking: true },
];

/** Module markers of the closing chapter, each above the room where it lives. */
export const BEACONS = [
  { module: 'calendar', x: 452, y: 236 },
  { module: 'documents', x: 1000, y: 236 },
  { module: 'tasks', x: 1320, y: 236 },
  { module: 'expenses', x: 560, y: 614 },
  { module: 'chat', x: 1080, y: 614 },
];

export const HUB = { x: 800, y: 138 };

/** Crops used by the stacked (mobile) journey, as SVG viewBoxes. */
export const CROPS = {
  cooking: '214 618 340 255',
  working: '944 290 340 255',
  relaxing: '898 640 320 240',
  groceries: '760 676 300 225',
  expenses: '512 598 330 248',
  calendar: '300 214 400 300',
  documents: '924 186 310 233',
  tasks: '1196 220 264 198',
  chat: '898 640 320 240',
};

export const CROP_ROOMS = {
  cooking: ['kitchen'],
  working: ['study'],
  relaxing: ['living'],
  groceries: ['kitchen', 'living'],
  expenses: ['kitchen', 'living'],
  calendar: ['hallway'],
  documents: ['study'],
  tasks: ['study'],
  chat: ['living'],
};
