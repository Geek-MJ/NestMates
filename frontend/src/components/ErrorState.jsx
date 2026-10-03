import { useTranslation } from 'react-i18next';
import cx from '../utils/cx.js';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import styles from './StatusPanel.module.css';

/** Shown when content couldn't be loaded. Offers a retry when `onRetry` is provided. */
export default function ErrorState({ title, message, onRetry, retrying = false, actions, className }) {
  const { t } = useTranslation();

  return (
    <section className={cx(styles.panel, 'enter', className)} role="alert">
      <span className={cx(styles.iconBadge, styles.iconBadgeDanger)}>
        <Icon name="alert" size={24} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.description}>{message}</p>}
      {(onRetry || actions) && (
        <div className={styles.actions}>
          {onRetry && (
            <Button icon="refresh" onClick={onRetry} loading={retrying}>
              {t('common.retry')}
            </Button>
          )}
          {actions}
        </div>
      )}
    </section>
  );
}
