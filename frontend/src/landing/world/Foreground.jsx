import { C } from './palette.js';

const LEAVES = [
  [40, 900, -30, 70],
  [90, 860, -10, 90],
  [140, 920, 20, 70],
  [1500, 880, 25, 80],
  [1560, 850, 5, 95],
  [1460, 930, -20, 60],
];

/** Out-of-focus planting in front of the home, giving the camera a near layer to move past. */
export default function Foreground() {
  return (
    <g>
      {LEAVES.map(([x, y, angle, size], index) => (
        <ellipse
          key={x}
          cx={x}
          cy={y}
          rx={size * 0.4}
          ry={size}
          transform={`rotate(${angle} ${x} ${y})`}
          fill={index % 2 ? C.sageDark : C.sage}
        />
      ))}
    </g>
  );
}
