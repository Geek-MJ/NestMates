import { C } from './palette.js';
import Person from './Person.jsx';
import Plant from './Plant.jsx';
import Window from './Window.jsx';

const BOOKS = [
  [836, 18, C.crimson],
  [856, 14, C.ochre],
  [872, 20, C.sage],
];

/** Ground-floor living room (x 808–1440, y 560–920): sofa with a resident reading their phone. */
export default function LivingRoom() {
  return (
    <g>
      <rect x="800" y="560" width="640" height="360" fill={C.wallSand} />
      <rect x="800" y="898" width="640" height="22" fill="url(#nm-planks)" />
      <rect x="800" y="560" width="640" height="338" fill="url(#nm-depth)" />

      <g>
        <rect x="826" y="636" width="74" height="262" rx="3" fill={C.woodLight} />
        <path d="M830 700h66M830 770h66M830 840h66" stroke={C.wood} strokeWidth="5" />
        {BOOKS.map(([x, width, color]) => (
          <rect key={x} x={x} y="656" width={width} height="42" rx="2" fill={color} />
        ))}
        <rect x="840" y="740" width="44" height="28" rx="4" fill={C.cream} />
        <circle cx="862" cy="822" r="15" fill={C.terracottaSoft} />
        <rect x="836" y="852" width="54" height="40" rx="3" fill={C.wood} />
      </g>
      <Plant x={866} y={636} variant="small" pot={C.charcoal} />

      <g>
        <rect x="984" y="634" width="150" height="96" rx="2" fill={C.woodDark} />
        <rect x="990" y="640" width="138" height="84" fill={C.paper} />
        <circle cx="1034" cy="676" r="20" fill={C.terracotta} />
        <path d="M1050 724q30-46 72-26v26z" fill={C.sage} />
        <rect x="1000" y="708" width="40" height="5" rx="2" fill={C.ochre} />
      </g>

      <rect x="1216" y="596" width="16" height="250" rx="6" fill={C.wallClay} />
      <Window x={1236} y={604} width={170} height={226} columns={2} rows={2} />

      <g>
        <path d="M1212 898V650q0-14-14-14h-34" stroke={C.charcoal} strokeWidth="4" fill="none" />
        <ellipse cx="1212" cy="896" rx="16" ry="4" fill={C.charcoal} />
        <circle cx="1166" cy="660" r="46" fill="url(#nm-lamp)" />
        <path d="M1146 652l8-24h24l8 24z" fill={C.cream} />
      </g>

      <g data-anchor="chat">
        <rect x="934" y="780" width="248" height="58" rx="20" fill={C.sofaShade} />
        <rect x="944" y="772" width="110" height="52" rx="18" fill={C.sofa} />
        <rect x="1062" y="772" width="110" height="52" rx="18" fill={C.sofa} />
        <rect x="938" y="824" width="240" height="40" rx="12" fill={C.sofa} />
        <rect x="920" y="796" width="34" height="76" rx="14" fill={C.sofaShade} />
        <rect x="1162" y="796" width="34" height="76" rx="14" fill={C.sofaShade} />
        <rect x="952" y="864" width="8" height="18" rx="2" fill={C.woodDark} />
        <rect x="1156" y="864" width="8" height="18" rx="2" fill={C.woodDark} />
        <rect x="966" y="790" width="40" height="36" rx="10" fill={C.ochre} transform="rotate(-8 986 808)" />
        <rect x="1118" y="792" width="36" height="34" rx="10" fill={C.rose} transform="rotate(7 1136 809)" />
      </g>

      <Person
        x={1058}
        y={898}
        pose="seatedFront"
        skin={C.skin[3]}
        hair={C.hair[0]}
        hairStyle="curly"
        shirt={C.terracotta}
        pants={C.denim}
      />

      <rect x="924" y="894" width="280" height="6" rx="3" fill={C.terracottaSoft} />
      <g>
        <rect x="990" y="866" width="150" height="8" rx="3" fill={C.wood} />
        <path d="M1002 874v22M1128 874v22" stroke={C.woodDark} strokeWidth="5" />
        <rect x="1010" y="856" width="22" height="10" rx="2" fill={C.cream} />
        <rect x="1094" y="852" width="12" height="14" rx="3" fill={C.terracotta} />
      </g>

      <Plant x={1418} y={898} variant="tall" pot={C.terracotta} scale={0.9} />
    </g>
  );
}
