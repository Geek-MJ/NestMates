import { C } from './palette.js';
import styles from './World.module.css';

const LEAVES = {
  tall: [
    [-6, -150, -28, 26],
    [10, -130, 24, 22],
    [-14, -105, -42, 24],
    [14, -88, 38, 24],
    [-4, -70, -20, 20],
  ],
  bushy: [
    [-18, -62, -40, 20],
    [18, -62, 40, 20],
    [0, -78, 0, 22],
    [-10, -46, -55, 18],
    [12, -44, 55, 18],
  ],
  small: [
    [-7, -30, -35, 11],
    [7, -30, 35, 11],
    [0, -38, 0, 12],
  ],
};

/**
 * Potted plant, drawn from the bottom centre of its pot at (x, y).
 * Variants: tall (floor plant), bushy (side table), small (shelf).
 */
export default function Plant({ x, y, variant = 'bushy', pot = C.terracotta, scale = 1, sway = true }) {
  const leaves = LEAVES[variant];
  const potWidth = variant === 'small' ? 22 : variant === 'tall' ? 46 : 36;
  const potHeight = variant === 'small' ? 18 : variant === 'tall' ? 44 : 30;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={sway ? styles.sway : undefined}>
        {variant === 'tall' && <path d="M0 -40V-150" stroke={C.sageDark} strokeWidth="3" fill="none" />}
        {leaves.map(([lx, ly, angle, size], index) => (
          <ellipse
            key={index}
            cx={lx}
            cy={ly}
            rx={size * 0.48}
            ry={size}
            transform={`rotate(${angle} ${lx} ${ly})`}
            fill={index % 2 ? C.sageDark : C.sage}
          />
        ))}
      </g>
      <path
        d={`M${-potWidth / 2} ${-potHeight}H${potWidth / 2}L${potWidth / 2 - 5} 0H${-potWidth / 2 + 5}Z`}
        fill={pot}
      />
      <rect x={-potWidth / 2 - 2} y={-potHeight - 4} width={potWidth + 4} height="6" rx="2" fill={pot} />
    </g>
  );
}
