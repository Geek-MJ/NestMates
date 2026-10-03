import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './Alert.module.css';

const ICONS = {
  error: 'alert',
  info: 'info',
  success: 'checkCircle',
};

/** Inline message for a whole form or section. Errors interrupt screen readers; others are polite. */
export default function Alert({ tone = 'error', title, children, className }) {
  return (
    <div
      className={cx(styles.alert, styles[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon name={ICONS[tone]} size={20} className={styles.icon} />
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.body}>{children}</div>}
      </div>
    </div>
  );
}
