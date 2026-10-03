import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Arrow from '../../components/Arrow.jsx';
import Icon from '../../components/Icon.jsx';
import InteractiveButton from '../../components/InteractiveButton.jsx';
import cx from '../../utils/cx.js';
import { goToScene } from '../navigation.js';
import styles from './SceneText.module.css';

const FLOW = ['record', 'calculate', 'settle'];

export const headingId = (sceneId) => `scene-${sceneId}-title`;

function Arrival() {
  const { t } = useTranslation();
  return (
    <>
      <h1 id={headingId('arrival')} className={styles.hero} tabIndex={-1}>
        <span className={styles.wordmark}>{t('app.name')}</span>
        <span className={styles.tagline}>{t('landing.scenes.arrival.tagline')}</span>
      </h1>
      <p className={styles.lead}>{t('landing.scenes.arrival.lead')}</p>
      <div className={styles.actions}>
        <InteractiveButton to="/register">{t('landing.scenes.arrival.cta')}</InteractiveButton>
        <InteractiveButton
          as="button"
          variant="secondary"
          arrow="down"
          onClick={() => goToScene('enter')}
        >
          {t('landing.scenes.arrival.explore')}
        </InteractiveButton>
      </div>
    </>
  );
}

function Final() {
  const { t } = useTranslation();
  return (
    <>
      <h2 id={headingId('final')} className={styles.hero} tabIndex={-1}>
        <span className={styles.wordmark}>{t('app.name')}</span>
        <span className={styles.tagline}>{t('landing.scenes.final.tagline')}</span>
      </h2>
      <p className={styles.lead}>{t('landing.scenes.final.body')}</p>
      <div className={styles.actions}>
        <InteractiveButton to="/register">{t('landing.scenes.final.create')}</InteractiveButton>
        <InteractiveButton to="/register" variant="secondary">
          {t('landing.scenes.final.join')}
        </InteractiveButton>
      </div>
      <p className={styles.hint}>{t('landing.scenes.final.joinHint')}</p>
      <p className={styles.hint}>
        <Link to="/login" className={styles.inlineLink}>
          {t('landing.scenes.final.login')}
          <Arrow size={14} className={styles.inlineArrow} />
        </Link>
      </p>
    </>
  );
}

function Feature({ scene }) {
  const { t } = useTranslation();
  const base = `landing.scenes.${scene.id}`;
  return (
    <>
      <p className={styles.kicker}>
        <span className={styles.kickerIcon}>
          <Icon name={scene.module} size={16} />
        </span>
        {t(`${base}.kicker`)}
      </p>
      <h2 id={headingId(scene.id)} className={styles.title} tabIndex={-1}>
        {t(`${base}.title`)}
      </h2>
      <p className={styles.body}>{t(`${base}.body`)}</p>
      {scene.id === 'expenses' && (
        <ol className={styles.flow}>
          {FLOW.map((step, index) => (
            <li key={step}>
              {index > 0 && <Arrow size={14} className={styles.flowArrow} />}
              {t(`landing.illustrations.expenses.steps.${step}`)}
            </li>
          ))}
        </ol>
      )}
      {scene.id === 'chat' && <p className={styles.pair}>{t('landing.scenes.chat.pair')}</p>}
    </>
  );
}

function Story({ scene }) {
  const { t } = useTranslation();
  const base = `landing.scenes.${scene.id}`;
  return (
    <>
      <h2 id={headingId(scene.id)} className={styles.title} tabIndex={-1}>
        {t(`${base}.title`)}
      </h2>
      <p className={styles.body}>{t(`${base}.body`)}</p>
    </>
  );
}

/** Text of one chapter of the landing story; identical in the desktop and stacked journeys. */
export default function SceneText({ scene, className }) {
  let content;
  if (scene.id === 'arrival') content = <Arrival />;
  else if (scene.id === 'final') content = <Final />;
  else if (scene.module) content = <Feature scene={scene} />;
  else content = <Story scene={scene} />;

  return <div className={cx(styles.text, styles[scene.id], className)}>{content}</div>;
}
