import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon.jsx';
import TiltCard from '../components/TiltCard.jsx';
import SceneText, { headingId } from './components/SceneText.jsx';
import useInView from './hooks/useInView.js';
import { ILLUSTRATIONS } from './illustrations/index.js';
import { sceneElementId } from './navigation.js';
import { SCENES } from './scenes.js';
import HomeScene, { RoomVignette } from './world/HomeScene.jsx';
import { BEACONS, CROP_ROOMS, CROPS, RESIDENTS } from './world/places.js';
import styles from './StackedJourney.module.css';

const HOME_VIEW = '96 40 1408 920';

/** Visual block that reveals once (--step 0 to 1) and keeps its ambient animation for while it is visible. */
function Visual({ className, children }) {
  const [ref, inView, seen] = useInView();
  return (
    <div ref={ref} className={`${styles.visual} ${className ?? ''}`} data-revealed={seen} data-live={inView}>
      {children}
    </div>
  );
}

function Hero({ scene }) {
  return (
    <>
      <SceneText scene={scene} className={styles.text} />
      <Visual className={styles.homeVisual}>
        <HomeScene facade view={HOME_VIEW} className={styles.home} />
      </Visual>
    </>
  );
}

function Enter({ scene }) {
  return (
    <>
      <SceneText scene={scene} className={styles.text} />
      <Visual className={styles.homeVisual}>
        <HomeScene view={HOME_VIEW} className={styles.home} />
      </Visual>
    </>
  );
}

function People({ scene }) {
  const { t } = useTranslation();
  return (
    <>
      <SceneText scene={scene} className={styles.text} />
      <Visual className={styles.people}>
        {RESIDENTS.map(({ role }) => (
          <figure key={role} className={styles.resident}>
            <RoomVignette view={CROPS[role]} rooms={CROP_ROOMS[role]} walker={role === 'groceries'} className={styles.room} />
            <figcaption className={styles.role}>
              <span className={styles.roleDot} aria-hidden="true" />
              {t(`landing.scenes.people.roles.${role}`)}
            </figcaption>
          </figure>
        ))}
      </Visual>
    </>
  );
}

function Feature({ scene }) {
  const Illustration = ILLUSTRATIONS[scene.module];
  return (
    <>
      <SceneText scene={scene} className={styles.text} />
      <Visual className={styles.feature}>
        <RoomVignette view={CROPS[scene.id]} rooms={CROP_ROOMS[scene.id]} className={styles.featureRoom} />
        <TiltCard className={styles.featureCard}>
          <Illustration className={styles.card} />
        </TiltCard>
      </Visual>
    </>
  );
}

function Final({ scene }) {
  const { t } = useTranslation();
  return (
    <>
      <SceneText scene={scene} className={styles.text} />
      <Visual className={styles.homeVisual}>
        <HomeScene view={HOME_VIEW} className={styles.home} />
        <ul className={styles.modules} aria-hidden="true">
          {BEACONS.map(({ module }, index) => (
            <li key={module} style={{ '--i': index }}>
              <span className={styles.moduleIcon}>
                <Icon name={module} size={16} />
              </span>
              {t(`nav.${module}`)}
            </li>
          ))}
        </ul>
      </Visual>
    </>
  );
}

const CONTENT = { arrival: Hero, enter: Enter, people: People, final: Final };

/** Mobile, tablet and reduced-motion journey: the same story, as a sequence of light sections. */
export default function StackedJourney() {
  return (
    <div className={styles.journey}>
      {SCENES.map((scene) => {
        const Content = CONTENT[scene.id] ?? Feature;
        return (
          <section
            key={scene.id}
            id={sceneElementId(scene.id)}
            className={styles.chapter}
            data-kind={CONTENT[scene.id] ? scene.id : 'feature'}
            aria-labelledby={headingId(scene.id)}
          >
            <Content scene={scene} />
          </section>
        );
      })}
    </div>
  );
}
