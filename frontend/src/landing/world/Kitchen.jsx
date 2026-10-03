import { C } from './palette.js';
import Person from './Person.jsx';
import Plant from './Plant.jsx';
import Window from './Window.jsx';
import styles from './World.module.css';

function Pendant({ x }) {
  return (
    <g>
      <path d={`M${x} 560v74`} stroke={C.ink} strokeWidth="2" />
      <path d={`M${x - 70} 800L${x - 14} 650h28L${x + 70} 800z`} fill="url(#nm-cone)" opacity="0.55" />
      <path d={`M${x - 20} 652a20 18 0 0 1 40 0z`} fill={C.charcoal} />
      <ellipse cx={x} cy="652" rx="9" ry="3" fill={C.light} />
    </g>
  );
}

/** Ground-floor kitchen and dining (x 160–800, y 560–920): cook at the island, dining table. */
export default function Kitchen() {
  return (
    <g>
      <rect x="160" y="560" width="640" height="360" fill={C.wallClay} />
      <rect x="250" y="700" width="300" height="86" fill="url(#nm-tiles)" />
      <rect x="160" y="898" width="640" height="22" fill="url(#nm-planks)" />
      <rect x="160" y="560" width="640" height="338" fill="url(#nm-depth)" />

      <g>
        <rect x="176" y="626" width="70" height="272" rx="6" fill={C.appliance} />
        <path d="M176 716h70" stroke="#d8d0c5" strokeWidth="2" />
        <rect x="234" y="650" width="4" height="40" rx="2" fill="#b9b0a4" />
        <rect x="234" y="732" width="4" height="60" rx="2" fill="#b9b0a4" />
        <rect x="256" y="598" width="96" height="84" rx="3" fill={C.woodLight} />
        <path d="M304 598v84" stroke={C.wood} strokeWidth="2" />
        <circle cx="298" cy="660" r="2.5" fill={C.woodDark} />
        <circle cx="310" cy="660" r="2.5" fill={C.woodDark} />
      </g>

      <Window x={372} y={598} width={156} height={92} columns={2} />
      <Plant x={398} y={697} variant="small" pot={C.terracotta} />
      <Plant x={430} y={697} variant="small" pot={C.cream} />

      <g>
        <rect x="248" y="786" width="304" height="12" rx="2" fill={C.wood} />
        <rect x="252" y="798" width="296" height="100" fill={C.woodLight} />
        <path d="M326 798v100M400 798v100M474 798v100" stroke={C.wood} strokeWidth="2" />
        <rect x="456" y="756" width="28" height="30" rx="8" fill={C.charcoal} />
        <path d="M484 764q12 2 8 14" stroke={C.charcoal} strokeWidth="4" fill="none" />
      </g>

      <Person
        x={384}
        y={898}
        pose="standing"
        activity="stir"
        skin={C.skin[0]}
        hair={C.hair[2]}
        hairStyle="long"
        shirt={C.denim}
        pants={C.ink}
        apron={C.cream}
      />

      <g>
        <g className={styles.steam}>
          <path d="M370 760q-8-12 0-24t0-24" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M392 756q-8-12 0-24t0-24" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
        <rect x="356" y="770" width="52" height="32" rx="6" fill={C.charcoal} />
        <rect x="350" y="768" width="64" height="7" rx="3" fill={C.ink} />
        <rect x="430" y="794" width="56" height="8" rx="2" fill={C.woodDark} />
        <circle cx="446" cy="790" r="7" fill={C.terracotta} />
        <circle cx="464" cy="791" r="6" fill={C.sage} />
        <rect x="286" y="802" width="214" height="12" rx="3" fill={C.cream} />
        <rect x="292" y="814" width="202" height="84" fill={C.wood} />
        <path d="M326 814v84M360 814v84M394 814v84M428 814v84M462 814v84" stroke={C.woodDark} strokeWidth="1.5" opacity="0.5" />
      </g>

      <g data-anchor="expenses">
        <Pendant x={640} />
        <Pendant x={720} />
        <path d="M562 836h40" stroke={C.woodDark} strokeWidth="6" />
        <path d="M566 836v62M598 836v62M562 836V770" stroke={C.woodDark} strokeWidth="5" />
        <path d="M778 836h-40" stroke={C.woodDark} strokeWidth="6" />
        <path d="M774 836v62M742 836v62M778 836V770" stroke={C.woodDark} strokeWidth="5" />
        <rect x="586" y="800" width="168" height="10" rx="3" fill={C.wood} />
        <rect x="598" y="810" width="7" height="88" fill={C.woodDark} />
        <rect x="735" y="810" width="7" height="88" fill={C.woodDark} />
        <ellipse cx="640" cy="796" rx="24" ry="6" fill={C.cream} />
        <circle cx="632" cy="788" r="7" fill={C.ochre} />
        <circle cx="646" cy="789" r="6" fill={C.terracotta} />
        <rect x="704" y="772" width="14" height="28" rx="5" fill={C.sage} />
        <path d="M711 772q-4-14 -12-18M711 772q6-12 14-14" stroke={C.sageDark} strokeWidth="2.5" fill="none" />
        <circle cx="699" cy="754" r="4" fill={C.rose} />
      </g>
    </g>
  );
}
