import { C } from './palette.js';

export const ROOF = 'M104 198L800 54L1496 198L1478 210L800 70L122 210Z';
export const GABLE = 'M160 182L800 78L1440 182Z';

/** Cut-away structure of the home: roof, attic, outer walls, floor slabs and partitions. */
export default function HouseShell() {
  return (
    <g>
      <path d={GABLE} fill={C.attic} />
      <path d="M380 182L800 112L1220 182" stroke={C.plasterShade} strokeWidth="6" fill="none" />
      <circle cx="800" cy="138" r="24" fill={C.structure} />
      <circle cx="800" cy="138" r="18" fill="url(#nm-glass)" />
      <rect x="560" y="160" width="60" height="22" rx="3" fill={C.woodLight} />
      <rect x="980" y="150" width="40" height="32" rx="3" fill={C.cream} />
      <path d={ROOF} fill={C.roof} />
      <path d="M104 198L122 210L800 70L1478 210L1496 198" stroke={C.roofEdge} strokeWidth="4" fill="none" />

      <rect x="140" y="176" width="1320" height="8" fill={C.structure} />
      <rect x="140" y="176" width="20" height="766" fill={C.structure} />
      <rect x="1440" y="176" width="20" height="766" fill={C.structure} />
      <rect x="140" y="540" width="1320" height="20" fill={C.structure} />
      <rect x="712" y="184" width="16" height="190" fill={C.structure} />
      <rect x="704" y="374" width="8" height="144" fill={C.woodDark} opacity="0.4" />
      <rect x="792" y="560" width="16" height="64" fill={C.structure} />
      <rect x="120" y="920" width="1360" height="22" fill={C.structure} />
      <g style={{ opacity: 'var(--open, 1)' }}>
        <rect x="120" y="942" width="1360" height="110" fill="#d6c0a0" />
        <path d="M120 972H1480M120 1008H1480" stroke="#c9b08d" strokeWidth="3" strokeDasharray="38 22" />
        <rect x="380" y="942" width="10" height="110" fill="#b9a284" />
        <rect x="1180" y="942" width="10" height="110" fill="#b9a284" />
      </g>
    </g>
  );
}
