import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon.jsx';
import { BEACONS, RESIDENTS } from '../world/places.js';
import styles from './WorldLabels.module.css';

/**
 * Labels pinned to places in the world. They follow the camera but are counter-scaled
 * (--S) so they stay crisp and readable at any zoom. Decorative: the chapter text says the same.
 */
export default function WorldLabels() {
  const { t } = useTranslation();

  return (
    <div className={styles.layer} aria-hidden="true">
      {RESIDENTS.map(({ role, x, y, walking }) => (
        <span
          key={role}
          className={styles.role}
          data-walking={walking || undefined}
          style={{ left: x, top: y }}
        >
          <span className={styles.roleDot} />
          {t(`landing.scenes.people.roles.${role}`)}
        </span>
      ))}
      {BEACONS.map(({ module, x, y }, index) => (
        <span key={module} className={styles.beacon} style={{ left: x, top: y, '--i': index }}>
          <span className={styles.beaconIcon}>
            <Icon name={module} size={18} />
          </span>
          {t(`nav.${module}`)}
        </span>
      ))}
    </div>
  );
}
