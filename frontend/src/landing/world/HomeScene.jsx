import Backdrop from './Backdrop.jsx';
import Facade from './Facade.jsx';
import Hallway from './Hallway.jsx';
import HouseShell from './HouseShell.jsx';
import Kitchen from './Kitchen.jsx';
import LivingRoom from './LivingRoom.jsx';
import { C } from './palette.js';
import Person from './Person.jsx';
import Study from './Study.jsx';
import styles from './World.module.css';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 1000;

const ROOMS = {
  hallway: Hallway,
  study: Study,
  kitchen: Kitchen,
  living: LivingRoom,
};

const ALL_ROOMS = Object.keys(ROOMS);

export function Walker() {
  return (
    <g className={styles.walker}>
      <Person
        x={900}
        y={898}
        pose="walking"
        skin={C.skin[1]}
        hair={C.hair[1]}
        hairStyle="curly"
        shirt={C.sage}
        pants={C.charcoal}
      />
    </g>
  );
}

/** Every room of the home with its residents, plus the cut-away structure. */
export function HomeInterior({ rooms = ALL_ROOMS, walker = true, shell = true }) {
  return (
    <g>
      {rooms.map((room) => {
        const Room = ROOMS[room];
        return <Room key={room} />;
      })}
      {walker && <Walker />}
      {shell && <HouseShell />}
    </g>
  );
}

/**
 * Self-contained illustration of the home in a single SVG (used where no camera is needed).
 * `view` crops the world; `facade` draws the closed front of the house over the interior.
 */
export default function HomeScene({
  view = `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`,
  rooms,
  walker = true,
  facade = false,
  backdrop = true,
  className,
  live = false,
  preserveAspectRatio = 'xMidYMid meet',
  children,
}) {
  return (
    <svg
      className={className}
      viewBox={view}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
      focusable="false"
      data-live={live ? 'true' : undefined}
    >
      {backdrop && <Backdrop />}
      {facade ? <Facade /> : <HomeInterior rooms={rooms} walker={walker} />}
      {children}
    </svg>
  );
}

export function RoomVignette({ view, rooms, walker = false, className, live }) {
  return (
    <HomeScene
      view={view}
      rooms={rooms}
      walker={walker}
      backdrop={false}
      className={className}
      live={live}
      preserveAspectRatio="xMidYMid slice"
    />
  );
}
