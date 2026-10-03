import { C } from './palette.js';
import styles from './World.module.css';

function Hair({ style, color, cx = 0, cy }) {
  switch (style) {
    case 'bun':
      return (
        <g fill={color}>
          <path d={`M${cx - 17} ${cy}a17 17 0 0 1 34 0q-4-8-17-9q-13 1-17 9z`} />
          <circle cx={cx} cy={cy - 21} r="8" />
        </g>
      );
    case 'curly':
      return (
        <g fill={color}>
          {[-13, -5, 4, 12].map((dx, index) => (
            <circle key={dx} cx={cx + dx} cy={cy - 12 - (index % 2) * 4} r="8" />
          ))}
          <circle cx={cx - 16} cy={cy - 2} r="6" />
          <circle cx={cx + 16} cy={cy - 2} r="6" />
        </g>
      );
    case 'long':
      return (
        <path
          fill={color}
          d={`M${cx - 18} ${cy}q-2-22 18-20q20-2 18 20l2 30h-8l0-28q-12-10-24 0l0 28h-8z`}
        />
      );
    default:
      return <path fill={color} d={`M${cx - 18} ${cy + 2}q-1-22 18-21q19-1 18 21q-6-12-18-12q-12 0-18 12z`} />;
  }
}

function Arm({ d, sleeve, skin, hand }) {
  return (
    <g>
      <path d={d} stroke={sleeve} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="5.5" fill={skin} />
    </g>
  );
}

function Standing({ skin, hair, hairStyle, shirt, pants, apron, activity }) {
  return (
    <g>
      <rect x="-15" y="-86" width="13" height="80" rx="5" fill={pants} />
      <rect x="2" y="-86" width="13" height="80" rx="5" fill={pants} />
      <ellipse cx="-9" cy="-3" rx="10" ry="4" fill={C.charcoal} />
      <ellipse cx="9" cy="-3" rx="10" ry="4" fill={C.charcoal} />
      <path d="M-27 -138q0-10 10-10h34q10 0 10 10l-4 56h-46z" fill={shirt} />
      {apron && <path d="M-15 -130h30l3 50h-36z" fill={apron} />}
      <rect x="-5" y="-157" width="10" height="11" fill={skin} />
      <circle cx="0" cy="-170" r="17" fill={skin} />
      <Hair style={hairStyle} color={hair} cy={-172} />
      <Arm d="M-23 -136q-9 22 7 34" sleeve={shirt} skin={skin} hand={[-15, -102]} />
      <g className={activity === 'stir' ? styles.stir : undefined}>
        <path d="M14 -104l-8 -44" stroke={C.woodDark} strokeWidth="4" strokeLinecap="round" />
        <Arm d="M23 -136q9 22 -7 32" sleeve={shirt} skin={skin} hand={[15, -104]} />
      </g>
    </g>
  );
}

function SeatedFront({ skin, hair, hairStyle, shirt, pants }) {
  return (
    <g>
      <path d="M-24 -136q0-9 9-9h30q9 0 9 9l-2 58h-44z" fill={shirt} />
      <rect x="-5" y="-155" width="10" height="11" fill={skin} />
      <circle cx="0" cy="-167" r="17" fill={skin} />
      <Hair style={hairStyle} color={hair} cy={-169} />
      <rect x="-27" y="-84" width="54" height="28" rx="12" fill={pants} />
      <path d="M-20 -60l-4 54M20 -60l4 54" stroke={pants} strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="-26" cy="-3" rx="10" ry="4" fill={C.charcoal} />
      <ellipse cx="26" cy="-3" rx="10" ry="4" fill={C.charcoal} />
      <Arm d="M-21 -134q-10 26 12 34" sleeve={shirt} skin={skin} hand={[-8, -100]} />
      <Arm d="M21 -134q10 26 -12 34" sleeve={shirt} skin={skin} hand={[8, -100]} />
      <rect x="-9" y="-122" width="18" height="27" rx="3" fill={C.charcoal} />
      <rect className={styles.phoneGlow} x="-6.5" y="-119" width="13" height="20" rx="1.5" fill={C.screenGlow} />
    </g>
  );
}

function SeatedBack({ skin, hair, hairStyle, shirt }) {
  return (
    <g>
      <g className={styles.typing}>
        <path d="M-27 -128q-14 26 -2 42" stroke={shirt} strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M27 -128q14 26 2 42" stroke={shirt} strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M-29 -126q0-12 11-12h36q11 0 11 12l-4 66h-50z" fill={shirt} />
        <rect x="-6" y="-150" width="12" height="13" fill={skin} />
        <ellipse cx="-18" cy="-160" rx="3.5" ry="5.5" fill={skin} />
        <ellipse cx="18" cy="-160" rx="3.5" ry="5.5" fill={skin} />
        <circle cx="0" cy="-163" r="18" fill={hair} />
        {hairStyle === 'bun' && <circle cx="0" cy="-185" r="8" fill={hair} />}
      </g>
      <rect x="-36" y="-100" width="72" height="58" rx="13" fill={C.slate} />
      <rect x="-3" y="-44" width="6" height="34" fill={C.charcoal} />
      <path d="M-28 -8h56" stroke={C.charcoal} strokeWidth="5" strokeLinecap="round" />
      <circle cx="-26" cy="-3" r="3" fill={C.charcoal} />
      <circle cx="26" cy="-3" r="3" fill={C.charcoal} />
    </g>
  );
}

function Walking({ skin, hair, hairStyle, shirt, pants }) {
  return (
    <g>
      <g className={`${styles.leg} ${styles.legBack}`}>
        <rect x="-6" y="-86" width="12" height="80" rx="5" fill={pants} />
        <ellipse cx="-6" cy="-3" rx="12" ry="4" fill={C.charcoal} />
      </g>
      <path d="M8 -140q8 22 6 38" stroke={shirt} strokeWidth="11" strokeLinecap="round" fill="none" />
      <g className={`${styles.leg} ${styles.legFront}`}>
        <rect x="-6" y="-86" width="12" height="80" rx="5" fill={pants} />
        <ellipse cx="-6" cy="-3" rx="12" ry="4" fill={C.charcoal} />
      </g>
      <path d="M-15 -142q0-10 9-10h12q12 0 12 12l-4 58h-28z" fill={shirt} />
      <rect x="-5" y="-160" width="10" height="11" fill={skin} />
      <circle cx="-1" cy="-172" r="16" fill={skin} />
      <circle cx="-16" cy="-170" r="3.2" fill={skin} />
      {hairStyle === 'curly' ? (
        <g fill={hair}>
          <circle cx="-6" cy="-184" r="8" />
          <circle cx="5" cy="-183" r="8" />
          <circle cx="12" cy="-172" r="7" />
        </g>
      ) : (
        <path fill={hair} d="M-17 -176q2-16 18-15q18 2 15 23q-4 4-7-1q-4-11-26-7z" />
      )}
      <g>
        <rect x="-44" y="-114" width="36" height="46" rx="3" fill="#cfa877" />
        <path d="M-44 -104h36" stroke="#b88f5f" strokeWidth="2" />
        <ellipse cx="-34" cy="-118" rx="5" ry="10" fill={C.sage} transform="rotate(-18 -34 -118)" />
        <ellipse cx="-24" cy="-121" rx="5" ry="11" fill={C.sageDark} />
        <rect x="-18" y="-136" width="8" height="30" rx="4" fill={C.ochre} transform="rotate(14 -14 -121)" />
      </g>
      <Arm d="M-2 -140q-6 24 -14 34" sleeve={shirt} skin={skin} hand={[-16, -104]} />
    </g>
  );
}

const POSES = {
  standing: Standing,
  seatedFront: SeatedFront,
  seatedBack: SeatedBack,
  walking: Walking,
};

/** Stylized resident, anchored at the point between their feet (or their chair base). */
export default function Person({ x, y, pose, scale = 1, flip = false, ...look }) {
  const Pose = POSES[pose];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <g className={styles.figure}>
        <Pose {...look} />
      </g>
    </g>
  );
}
