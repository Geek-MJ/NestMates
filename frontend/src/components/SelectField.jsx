import { useId } from 'react';
import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './SelectField.module.css';

/** Labelled native select, using the same field treatment as the text inputs. */
export default function SelectField({ label, hint, error, id, className, children, ...selectProps }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? 'true' : undefined}>
        <select
          id={selectId}
          className={styles.select}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cx(hintId, errorId) || undefined}
          {...selectProps}
        >
          {children}
        </select>
      </div>
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <Icon name="alert" size={16} className={styles.errorIcon} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
