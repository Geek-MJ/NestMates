import { C } from './palette.js';

/**
 * Gradients and patterns shared by every illustration of the home. Rendered once per page;
 * SVG elements anywhere in the document can reference them by id.
 */
export default function WorldDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="nm-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f6f4" />
          <stop offset="1" stopColor="#cbdad8" />
        </linearGradient>
        <linearGradient id="nm-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fce8c4" />
          <stop offset="1" stopColor="#f0bf83" />
        </linearGradient>
        <linearGradient id="nm-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.light} stopOpacity="0.7" />
          <stop offset="1" stopColor={C.light} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nm-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.charcoal} stopOpacity="0.05" />
          <stop offset="0.35" stopColor={C.charcoal} stopOpacity="0" />
          <stop offset="1" stopColor={C.charcoal} stopOpacity="0.07" />
        </linearGradient>
        <radialGradient id="nm-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6d6a6" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#f3d3a4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f3d3a4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nm-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fbe1b3" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fbe1b3" stopOpacity="0" />
        </radialGradient>
        <pattern id="nm-tiles" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill={C.tile} />
          <path d="M0 .5H22M.5 0V22" stroke={C.tileLine} strokeWidth="1" />
        </pattern>
        <pattern id="nm-cladding" width="16" height="20" patternUnits="userSpaceOnUse">
          <rect width="16" height="20" fill={C.cladding} />
          <path d="M.5 0V20" stroke={C.claddingLine} strokeWidth="1.5" />
        </pattern>
        <pattern id="nm-planks" width="90" height="22" patternUnits="userSpaceOnUse">
          <rect width="90" height="22" fill={C.floor} />
          <path d="M.5 0V22" stroke={C.floorLine} strokeWidth="1.5" />
        </pattern>
      </defs>
    </svg>
  );
}
