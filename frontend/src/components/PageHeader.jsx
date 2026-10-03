import cx from '../utils/cx.js';
import HomeMotif from './HomeMotif.jsx';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, description, actions, motif, className }) {
  return (
    <header className={cx(styles.header, 'enter', className)}>
      <div className={styles.lead}>
        {motif && (
          <div className={styles.motif}>
            <HomeMotif name={motif} />
          </div>
        )}
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
