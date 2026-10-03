import { useId } from 'react';
import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './Checkbox.module.css';

export default function Checkbox({ label, error, id, className, ...inputProps }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.option}>
        <span className={styles.boxWrapper}>
          <input
            id={inputId}
            type="checkbox"
            className={styles.input}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
            {...inputProps}
          />
          <span className={styles.box} aria-hidden="true">
            <Icon name="check" size={14} strokeWidth={2.5} className={styles.check} />
          </span>
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {error && (
        <p id={errorId} className={styles.error}>
          <Icon name="alert" size={16} className={styles.errorIcon} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
