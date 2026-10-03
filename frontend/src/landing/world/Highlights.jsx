import { C } from './palette.js';
import { BEACONS, FOCUS, HUB } from './places.js';
import styles from './Highlights.module.css';

/**
 * Overlays drawn inside the world on desktop: an outline around the object of each feature
 * chapter, and the lines linking the modules together in the closing chapter.
 */
export default function Highlights() {
  return (
    <g>
      {Object.entries(FOCUS).map(([id, { x, y, width, height }]) => (
        <g key={id} className={styles.focus} style={{ '--v': `var(--vis-${id}, 0)` }}>
          <rect x={x - 6} y={y - 6} width={width + 12} height={height + 12} rx="18" fill={C.light} opacity="0.35" />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx="14"
            fill="none"
            stroke={C.crimson}
            strokeWidth="2.5"
            strokeDasharray="7 6"
          />
        </g>
      ))}
      <g className={styles.links}>
        {BEACONS.map(({ module, x, y }) => (
          <path
            key={module}
            d={`M${HUB.x} ${HUB.y}Q${(HUB.x + x) / 2} ${Math.min(HUB.y, y) - 40} ${x} ${y}`}
            pathLength="1"
            fill="none"
            stroke={C.crimson}
            strokeWidth="2.5"
            strokeDasharray="1"
            strokeLinecap="round"
          />
        ))}
        <circle cx={HUB.x} cy={HUB.y} r="30" fill="none" stroke={C.crimson} strokeWidth="2.5" />
      </g>
    </g>
  );
}
