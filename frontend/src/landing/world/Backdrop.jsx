import { C } from './palette.js';
import styles from './World.module.css';

const SKYLINE = [
  [-520, 640, 140],
  [-360, 560, 110],
  [-230, 700, 120],
  [1720, 620, 130],
  [1870, 540, 100],
  [1990, 680, 150],
];

const TREES = [
  [-120, 860, 60],
  [40, 880, 44],
  [1560, 870, 54],
  [1700, 850, 66],
];

function Cloud({ x, y, scale }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#ffffff" opacity="0.75">
      <ellipse cx="0" cy="0" rx="70" ry="22" />
      <ellipse cx="-28" cy="-14" rx="34" ry="24" />
      <ellipse cx="22" cy="-18" rx="40" ry="28" />
    </g>
  );
}

/** Sky, distant neighbourhood, trees and ground around the home. Extends beyond the world frame. */
export default function Backdrop() {
  return (
    <g>
      <circle cx="1280" cy="120" r="210" fill="url(#nm-sun)" />
      <g className={styles.clouds}>
        <Cloud x={260} y={110} scale={1} />
        <Cloud x={1450} y={300} scale={0.8} />
        <Cloud x={-300} y={260} scale={1.2} />
      </g>
      <path d="M-1200 900Q-400 760 400 860T1900 820T2800 900V1000H-1200Z" fill={C.plasterShade} opacity="0.55" />
      {SKYLINE.map(([x, y, width]) => (
        <g key={x}>
          <rect x={x} y={y} width={width} height={1000 - y} fill="#e5d6c3" />
          <rect x={x + 20} y={y + 30} width="18" height="24" fill="#f3e8da" />
          <rect x={x + width - 40} y={y + 30} width="18" height="24" fill="#f3e8da" />
          <rect x={x + 20} y={y + 80} width="18" height="24" fill="#f3e8da" />
        </g>
      ))}
      {TREES.map(([x, y, radius]) => (
        <g key={x}>
          <rect x={x - 5} y={y} width="10" height={940 - y} fill={C.woodDark} />
          <circle cx={x} cy={y - radius * 0.6} r={radius} fill={C.sageLight} />
          <circle cx={x + radius * 0.5} cy={y - radius * 0.2} r={radius * 0.6} fill={C.sage} opacity="0.7" />
        </g>
      ))}
      <rect x="-1400" y="930" width="4400" height="400" fill="#e2d2bc" />
      <rect x="-1400" y="930" width="4400" height="10" fill="#d6c3a9" />
    </g>
  );
}
