import { C } from './palette.js';
import Person from './Person.jsx';
import Plant from './Plant.jsx';
import Window from './Window.jsx';

const BINDERS = [
  [972, 48, C.crimson],
  [990, 54, C.ochre],
  [1008, 50, C.sage],
  [1026, 44, C.paper],
  [1044, 52, C.denim],
  [1062, 48, C.terracotta],
];

const NOTES = [
  [1258, 272, '#f6e7b5', -4],
  [1314, 268, C.wallSage, 3],
  [1262, 334, '#f2d6cf', 2],
  [1322, 332, C.paper, -3],
];

/** Upstairs study (x 728–1440, y 180–540): desk with a seated worker, binders, task board. */
export default function Study() {
  return (
    <g>
      <rect x="720" y="180" width="720" height="360" fill={C.wallSage} />
      <rect x="720" y="518" width="720" height="22" fill="url(#nm-planks)" />
      <rect x="720" y="180" width="720" height="338" fill="url(#nm-depth)" />

      <rect x="752" y="214" width="16" height="230" rx="6" fill={C.terracottaSoft} />
      <Window x={772} y={226} width={150} height={190} columns={2} />
      <rect x="926" y="214" width="16" height="230" rx="6" fill={C.terracottaSoft} />

      <g data-anchor="documents">
        <rect x="960" y="270" width="230" height="8" rx="2" fill={C.wood} />
        <path d="M980 278v10M1170 278v10" stroke={C.woodDark} strokeWidth="4" />
        {BINDERS.map(([x, height, color]) => (
          <g key={x}>
            <rect x={x} y={270 - height} width="16" height={height} rx="2" fill={color} />
            <rect x={x + 4} y={270 - height + 8} width="8" height="12" rx="1" fill="#ffffff" opacity="0.65" />
          </g>
        ))}
        <rect x="1088" y="238" width="54" height="10" rx="2" fill={C.ochre} transform="rotate(-2 1115 243)" />
        <rect x="1086" y="248" width="58" height="10" rx="2" fill={C.cream} />
        <rect x="1090" y="258" width="52" height="12" rx="2" fill={C.denim} />
        <Plant x={1166} y={270} variant="small" pot={C.paper} sway={false} />
      </g>

      <g>
        <rect x="1030" y="324" width="120" height="78" rx="6" fill={C.charcoal} />
        <rect x="1036" y="330" width="108" height="64" rx="3" fill={C.screen} />
        <rect x="1046" y="342" width="44" height="6" rx="2" fill={C.screenGlow} opacity="0.85" />
        <rect x="1046" y="354" width="78" height="5" rx="2" fill={C.screenGlow} opacity="0.45" />
        <rect x="1046" y="364" width="60" height="5" rx="2" fill={C.screenGlow} opacity="0.45" />
        <rect x="1084" y="402" width="12" height="18" fill={C.ink} />
        <rect x="960" y="420" width="250" height="12" rx="3" fill={C.wood} />
        <rect x="968" y="432" width="7" height="86" fill={C.charcoal} />
        <rect x="1196" y="432" width="7" height="86" fill={C.charcoal} />
        <path d="M982 420l10-46 26 -12" stroke={C.charcoal} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M1008 356l20 4-6 14z" fill={C.terracotta} />
        <path d="M1024 370l-10 50h50z" fill="url(#nm-cone)" opacity="0.6" />
        <rect x="1170" y="400" width="14" height="20" rx="3" fill={C.cream} />
      </g>

      <Person
        x={1118}
        y={518}
        pose="seatedBack"
        skin={C.skin[2]}
        hair={C.hair[0]}
        hairStyle="bun"
        shirt={C.ochre}
      />

      <g data-anchor="tasks">
        <rect x="1240" y="248" width="164" height="154" rx="6" fill={C.woodDark} />
        <rect x="1248" y="256" width="148" height="138" rx="3" fill={C.cork} />
        {NOTES.map(([x, y, color, angle]) => (
          <g key={`${x}-${y}`} transform={`rotate(${angle} ${x + 24} ${y + 24})`}>
            <rect x={x} y={y} width="48" height="48" rx="2" fill={color} />
            <rect x={x + 8} y={y + 14} width="30" height="4" rx="2" fill={C.ink} opacity="0.35" />
            <rect x={x + 8} y={y + 24} width="22" height="4" rx="2" fill={C.ink} opacity="0.25" />
            <circle cx={x + 24} cy={y + 4} r="3.5" fill={C.crimson} />
          </g>
        ))}
      </g>

      <Plant x={1404} y={518} variant="tall" pot={C.charcoal} scale={0.85} />
      <path d="M1300 180v24" stroke={C.ink} strokeWidth="2" />
      <path d="M1284 214a16 12 0 0 1 32 0z" fill={C.ink} />
    </g>
  );
}
