import { C } from '../landing/world/palette.js';

/**
 * Small decorative scenes in the landing-page palette. They are not data and
 * are hidden from assistive technology.
 */
const SCENES = {
  expenses: ExpensesMotif,
  calendar: CalendarMotif,
  documents: DocumentsMotif,
  tasks: TasksMotif,
  chat: ChatMotif,
  profile: ProfileMotif,
  household: HouseholdMotif,
};

export default function HomeMotif({ name }) {
  const Scene = SCENES[name];
  if (!Scene) return null;
  return (
    <svg viewBox="0 0 96 72" aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  );
}

function ExpensesMotif() {
  return (
    <>
      <rect x="8" y="40" width="80" height="8" rx="2" fill={C.wood} />
      <rect x="6" y="48" width="84" height="6" rx="2" fill={C.woodDark} />
      <rect x="34" y="14" width="28" height="32" rx="2" fill={C.paper} stroke={C.tileLine} />
      <rect x="38" y="20" width="16" height="2" rx="1" fill={C.terracotta} />
      <rect x="38" y="26" width="20" height="2" rx="1" fill={C.tileLine} />
      <rect x="38" y="31" width="14" height="2" rx="1" fill={C.tileLine} />
      <circle cx="22" cy="30" r="8" fill={C.sage} />
      <rect x="20" y="30" width="4" height="12" rx="1" fill={C.sageDark} />
      <circle cx="74" cy="28" r="6" fill={C.ochre} />
    </>
  );
}

function CalendarMotif() {
  return (
    <>
      <rect x="14" y="10" width="44" height="52" rx="4" fill={C.paper} stroke={C.tileLine} />
      <rect x="14" y="10" width="44" height="12" rx="4" fill={C.crimson} />
      <rect x="14" y="18" width="44" height="4" fill={C.crimson} />
      <rect x="22" y="30" width="8" height="6" rx="1" fill={C.rose} />
      <rect x="34" y="30" width="8" height="6" rx="1" fill={C.ochre} />
      <rect x="46" y="30" width="8" height="6" rx="1" fill={C.tileLine} />
      <rect x="22" y="40" width="8" height="6" rx="1" fill={C.tileLine} />
      <rect x="34" y="40" width="8" height="6" rx="1" fill={C.sageLight} />
      <circle cx="74" cy="36" r="14" fill={C.cream} stroke={C.woodDark} />
      <path d="M74 28 v9 h7" fill="none" stroke={C.charcoal} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function DocumentsMotif() {
  return (
    <>
      <rect x="8" y="46" width="80" height="6" rx="2" fill={C.wood} />
      <rect x="10" y="52" width="76" height="4" rx="1" fill={C.woodDark} />
      <rect x="16" y="18" width="18" height="28" rx="2" fill={C.terracottaSoft} />
      <rect x="39" y="12" width="18" height="34" rx="2" fill={C.paper} stroke={C.tileLine} />
      <rect x="62" y="22" width="18" height="24" rx="2" fill={C.sageLight} />
      <rect x="43" y="20" width="10" height="2" rx="1" fill={C.tileLine} />
      <rect x="43" y="25" width="10" height="2" rx="1" fill={C.tileLine} />
    </>
  );
}

function TasksMotif() {
  return (
    <>
      <rect x="16" y="10" width="40" height="52" rx="4" fill={C.paper} stroke={C.tileLine} />
      <rect x="28" y="6" width="16" height="8" rx="2" fill={C.ochre} />
      <path d="M24 26 h16 M24 36 h16 M24 46 h12" stroke={C.tileLine} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 26 l2 2 4-4" fill="none" stroke={C.sageDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M68 20 v28" stroke={C.woodDark} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 48 h16 l-2 8 h-12 z" fill={C.terracotta} />
    </>
  );
}

function ChatMotif() {
  return (
    <>
      <rect x="10" y="44" width="76" height="16" rx="6" fill={C.sofa} />
      <rect x="10" y="40" width="10" height="16" rx="3" fill={C.sofaShade} />
      <rect x="76" y="40" width="10" height="16" rx="3" fill={C.sofaShade} />
      <circle cx="32" cy="30" r="7" fill={C.skin[0]} />
      <circle cx="58" cy="28" r="7" fill={C.skin[2]} />
      <path d="M26 24 q6-10 12 0" fill={C.hair[1]} />
      <path d="M52 22 q6-10 12 0" fill={C.hair[0]} />
      <path d="M62 12 h22 a6 6 0 0 1 0 12 h-16 l-6 6 v-6 a6 6 0 0 1 0-12 z" fill={C.cream} stroke={C.tileLine} />
    </>
  );
}

function ProfileMotif() {
  return (
    <>
      <rect x="18" y="8" width="40" height="48" rx="3" fill={C.glass} stroke={C.wood} />
      <path d="M18 32 h40 M38 8 v48" stroke={C.wood} strokeWidth="3" />
      <rect x="14" y="56" width="48" height="6" rx="2" fill={C.woodDark} />
      <circle cx="74" cy="40" r="10" fill={C.sage} />
      <rect x="71" y="48" width="6" height="12" rx="2" fill={C.terracotta} />
      <circle cx="30" cy="20" r="4" fill={C.light} />
    </>
  );
}

function HouseholdMotif() {
  return (
    <>
      <path d="M18 34 L48 12 L78 34 v28 H18 z" fill={C.plaster} stroke={C.structure} strokeWidth="2" />
      <path d="M12 36 L48 8 L84 36" fill="none" stroke={C.roof} strokeWidth="4" strokeLinejoin="round" />
      <rect x="40" y="40" width="16" height="22" rx="1" fill={C.wood} />
      <rect x="26" y="40" width="10" height="10" rx="1" fill={C.glass} />
      <rect x="60" y="40" width="10" height="10" rx="1" fill={C.glass} />
      <circle cx="52" cy="52" r="1.5" fill={C.ochre} />
    </>
  );
}
