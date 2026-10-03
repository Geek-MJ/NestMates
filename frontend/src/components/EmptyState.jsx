import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './StatusPanel.module.css';

/** Shown when a list genuinely has no items yet. */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <section className={cx(styles.panel, 'enter', className)}>
      {icon && (
        <span className={styles.iconBadge}>
          <Icon name={icon} size={24} />
        </span>
      )}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </section>
  );
}
