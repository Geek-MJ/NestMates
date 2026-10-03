import { C } from './palette.js';
import Plant from './Plant.jsx';
import Window from './Window.jsx';

const GRID_ROWS = [292, 312, 332, 352, 372];
const GRID_COLUMNS = [398, 416, 434, 452, 470, 488, 506];

/** Upstairs hallway (x 160–712, y 180–540): window, coat hooks, wall calendar, console. */
export default function Hallway() {
  return (
    <g>
      <rect x="160" y="180" width="560" height="360" fill={C.wallWarm} />
      <rect x="160" y="444" width="560" height="74" fill={C.wainscot} />
      <rect x="160" y="440" width="560" height="5" fill={C.cream} />
      <rect x="160" y="518" width="560" height="22" fill="url(#nm-planks)" />
      <rect x="160" y="180" width="560" height="338" fill="url(#nm-depth)" />

      <Window x={196} y={226} width={104} height={196} columns={1} rows={2} />

      <g>
        <rect x="318" y="246" width="36" height="5" rx="2" fill={C.woodDark} />
        <path d="M336 251v8" stroke={C.woodDark} strokeWidth="3" />
        <path d="M320 262q16-8 32 0l6 118h-44z" fill={C.terracotta} />
        <path d="M336 262v118" stroke="#a9563c" strokeWidth="2" />
        <path d="M344 300h22l4 54h-30z" fill={C.ochre} />
      </g>

      <g data-anchor="calendar">
        <rect x="384" y="250" width="138" height="150" rx="6" fill={C.shadow} transform="translate(4 5)" />
        <rect x="384" y="250" width="138" height="150" rx="6" fill={C.paper} />
        <rect x="384" y="250" width="138" height="26" rx="6" fill={C.crimson} />
        <rect x="384" y="268" width="138" height="8" fill={C.crimson} />
        <circle cx="414" cy="250" r="4" fill={C.charcoal} />
        <circle cx="492" cy="250" r="4" fill={C.charcoal} />
        {GRID_ROWS.map((rowY) =>
          GRID_COLUMNS.map((columnX) => (
            <rect key={`${rowY}-${columnX}`} x={columnX - 6} y={rowY - 5} width="12" height="10" rx="2" fill="#efe6da" />
          )),
        )}
        <circle cx="452" cy="332" r="9" fill={C.terracotta} />
        <rect x="474" y="348" width="38" height="8" rx="3" fill={C.sage} />
      </g>

      <g>
        <rect x="560" y="276" width="58" height="76" rx="2" fill={C.woodDark} />
        <rect x="566" y="282" width="46" height="64" fill={C.cream} />
        <circle cx="589" cy="306" r="11" fill={C.terracottaSoft} />
        <path d="M566 346l18-22 12 12 16-18v28z" fill={C.sage} />
        <rect x="632" y="300" width="52" height="52" rx="2" fill={C.woodDark} />
        <rect x="637" y="305" width="42" height="42" fill={C.paper} />
        <path d="M643 341q15-28 30 0" stroke={C.terracotta} strokeWidth="4" fill="none" />
      </g>

      <g>
        <rect x="540" y="446" width="160" height="10" rx="3" fill={C.wood} />
        <rect x="548" y="456" width="6" height="62" fill={C.woodDark} />
        <rect x="686" y="456" width="6" height="62" fill={C.woodDark} />
        <rect x="560" y="458" width="120" height="26" rx="3" fill={C.woodLight} />
        <ellipse cx="640" cy="440" rx="20" ry="6" fill={C.ink} />
        <rect x="604" y="426" width="10" height="20" rx="4" fill={C.sage} />
      </g>
      <Plant x={576} y={446} variant="bushy" pot={C.cream} scale={0.9} />
      <Plant x={262} y={518} variant="tall" pot={C.terracotta} scale={0.62} />

      <rect x="590" y="180" width="20" height="10" rx="3" fill={C.ink} />
      <ellipse cx="600" cy="194" rx="22" ry="7" fill={C.light} opacity="0.8" />
    </g>
  );
}
