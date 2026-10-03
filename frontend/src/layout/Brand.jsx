import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon.jsx';
import cx from '../utils/cx.js';
import styles from './Brand.module.css';

export default function Brand({ compact = false, className }) {
  const { t } = useTranslation();

  return (
    <span className={cx(styles.brand, className)}>
      <span className={styles.mark} aria-hidden="true">
        <Icon name="home" size={18} strokeWidth={2} />
      </span>
      <span className={compact ? 'visually-hidden' : styles.wordmark}>{t('app.name')}</span>
    </span>
  );
}
