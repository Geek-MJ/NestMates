import { useTranslation } from 'react-i18next';
import cx from '../utils/cx.js';
import styles from './Spinner.module.css';

/** Loading indicator. Announced to assistive technologies unless `decorative`. */
export default function Spinner({ size = 20, label, decorative = false, className }) {
  const { t } = useTranslation();

  const svg = (
    <svg
      className={cx(styles.spinner, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.track} cx="12" cy="12" r="9" />
      <circle className={styles.arc} cx="12" cy="12" r="9" />
    </svg>
  );

  if (decorative) return svg;

  return (
    <span role="status" className={styles.wrapper}>
      {svg}
      <span className="visually-hidden">{label ?? t('a11y.loading')}</span>
    </span>
  );
}
