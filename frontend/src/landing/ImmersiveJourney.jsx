import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TiltCard from '../components/TiltCard.jsx';
import SceneText, { headingId } from './components/SceneText.jsx';
import WorldLabels from './components/WorldLabels.jsx';
import useJourneyScroll from './hooks/useJourneyScroll.js';
import usePointerField from './hooks/usePointerField.js';
import { ILLUSTRATIONS } from './illustrations/index.js';
import { goToScene, sceneElementId } from './navigation.js';
import { SCENES } from './scenes.js';
import Backdrop from './world/Backdrop.jsx';
import Facade from './world/Facade.jsx';
import Foreground from './world/Foreground.jsx';
import Highlights from './world/Highlights.jsx';
import { HomeInterior, WORLD_HEIGHT, WORLD_WIDTH } from './world/HomeScene.jsx';
import styles from './ImmersiveJourney.module.css';

const VIEW_BOX = `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`;

function Layer({ className, children }) {
  return (
    <svg className={className} viewBox={VIEW_BOX} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/**
 * Desktop journey. A sticky stage shows the illustrated home through a camera that follows
 * the scroll position; the chapters' text scrolls normally over it.
 */
export default function ImmersiveJourney() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const worldRef = useRef(null);
  const chaptersRef = useRef(null);

  useJourneyScroll({ rootRef, worldRef, chaptersRef, scenes: SCENES, enabled: true });
  usePointerField(rootRef, { space: 'viewport' });

  return (
    <div ref={rootRef} className={styles.journey} data-scene="arrival">
      <div className={styles.stage}>
        <div className={styles.sky} aria-hidden="true" />
        <div ref={worldRef} className={styles.world} aria-hidden="true">
          <Layer className={styles.backdrop}>
            <Backdrop />
          </Layer>
          <Layer className={styles.interior}>
            <HomeInterior />
            <Highlights />
          </Layer>
          <Layer className={styles.facade}>
            <Facade />
          </Layer>
          <WorldLabels />
          <Layer className={styles.foreground}>
            <Foreground />
          </Layer>
        </div>
        <div className={styles.focusShade} aria-hidden="true" />
        <div className={styles.ambient} aria-hidden="true" />
        <div className={styles.scrim} aria-hidden="true" />

        <nav className={styles.rail} aria-label={t('landing.chapters')}>
          <ol>
            {SCENES.map((scene) => (
              <li key={scene.id}>
                <a
                  href={`#${sceneElementId(scene.id)}`}
                  className={styles.railLink}
                  style={{ '--v': `var(--vis-${scene.id}, 0)` }}
                  onClick={(event) => {
                    event.preventDefault();
                    goToScene(scene.id);
                  }}
                >
                  <span className={styles.railLabel}>{t(`landing.scenes.${scene.id}.label`)}</span>
                  <span className={styles.railMark} />
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className={styles.progress} aria-hidden="true" />
      </div>

      <div ref={chaptersRef} className={styles.chapters}>
        {SCENES.map((scene) => {
          const Illustration = scene.module && ILLUSTRATIONS[scene.module];
          return (
            <section
              key={scene.id}
              id={sceneElementId(scene.id)}
              data-chapter
              className={styles.chapter}
              aria-labelledby={headingId(scene.id)}
              style={{
                '--length': scene.length,
                '--lp': `var(--lp-${scene.id}, 0)`,
                '--vis': `var(--vis-${scene.id}, 0)`,
              }}
            >
              <SceneText scene={scene} className={styles.chapterText} />
              {Illustration && (
                <div className={styles.cardSlot} data-card={scene.id}>
                  <TiltCard className={styles.tilt}>
                    <Illustration className={styles.card} />
                  </TiltCard>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
