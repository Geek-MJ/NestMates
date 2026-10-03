import { C } from './palette.js';
import { GABLE, ROOF } from './HouseShell.jsx';
import Plant from './Plant.jsx';
import Window from './Window.jsx';
import styles from './World.module.css';

const WINDOWS = [
  [196, 226, 104, 196, 1, 2],
  [452, 262, 170, 150, 2, 1],
  [772, 226, 150, 190, 2, 1],
  [1236, 246, 168, 166, 2, 1],
  [196, 600, 150, 196, 2, 2],
  [372, 600, 156, 92, 2, 1],
  [980, 618, 168, 190, 2, 1],
  [1236, 604, 170, 226, 2, 2],
];

function Shrub({ x, width }) {
  return (
    <g fill={C.sage}>
      <ellipse cx={x} cy="914" rx={width * 0.32} ry="30" />
      <ellipse cx={x + width * 0.3} cy="918" rx={width * 0.28} ry="24" fill={C.sageDark} />
      <ellipse cx={x - width * 0.3} cy="920" rx={width * 0.26} ry="22" fill={C.sageLight} />
    </g>
  );
}

/**
 * Front of the home. The journey opens it from the door outwards (CSS mask) to reveal the
 * interior, so it is drawn as one layer above the rooms.
 */
export default function Facade() {
  return (
    <g>
      <path d={GABLE} fill={C.plaster} />
      <circle cx="800" cy="138" r="24" fill={C.structure} />
      <circle cx="800" cy="138" r="18" fill="url(#nm-glow)" />
      <rect x="140" y="182" width="820" height="760" fill={C.plaster} />
      <rect x="960" y="182" width="500" height="760" fill="url(#nm-cladding)" />
      <rect x="140" y="182" width="1320" height="760" fill="url(#nm-depth)" />
      <rect x="140" y="540" width="1320" height="16" fill={C.plasterShade} />
      <path d={ROOF} fill={C.roof} />
      <path d="M104 198L122 210L800 70L1478 210L1496 198" stroke={C.roofEdge} strokeWidth="4" fill="none" />
      <rect x="1220" y="70" width="44" height="90" fill={C.structure} />
      <rect x="1214" y="64" width="56" height="10" fill={C.roofEdge} />

      {WINDOWS.map(([x, y, width, height, columns, rows]) => (
        <Window key={`${x}-${y}`} x={x} y={y} width={width} height={height} columns={columns} rows={rows} glow />
      ))}
      <path d="M1016 808v-60l-18-26h44l-18 26v60" fill={C.ochre} opacity="0.35" />
      <path d="M238 796q-20-40 0-80q20 40 0 80z" fill={C.sageDark} opacity="0.35" />

      <g>
        <rect x="716" y="668" width="168" height="12" rx="3" fill={C.charcoal} />
        <rect x="732" y="684" width="136" height="236" rx="4" fill={C.structure} />
        <rect x="742" y="694" width="116" height="226" fill="url(#nm-glow)" />
        <g className={styles.door}>
          <rect x="752" y="694" width="106" height="226" fill={C.woodDark} />
          <rect x="766" y="712" width="78" height="80" rx="3" fill="none" stroke={C.wood} strokeWidth="3" />
          <rect x="766" y="808" width="78" height="92" rx="3" fill="none" stroke={C.wood} strokeWidth="3" />
          <circle cx="842" cy="806" r="5" fill={C.ochre} />
        </g>
        <circle cx="900" cy="724" r="30" fill="url(#nm-lamp)" />
        <rect x="894" y="712" width="12" height="22" rx="4" fill={C.charcoal} />
        <rect x="896" y="716" width="8" height="12" rx="2" fill={C.light} />
        <rect x="724" y="920" width="152" height="10" fill={C.plasterShade} />
        <rect x="708" y="930" width="184" height="12" fill={C.wainscot} />
      </g>

      <Plant x={690} y={920} variant="bushy" pot={C.charcoal} />
      <Plant x={910} y={920} variant="bushy" pot={C.charcoal} />
      <Shrub x={270} width={220} />
      <Shrub x={500} width={150} />
      <Shrub x={1110} width={180} />
      <Shrub x={1340} width={220} />
    </g>
  );
}
