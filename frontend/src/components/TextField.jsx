import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './TextField.module.css';

/** Labelled text input with hint and error text. Password fields get a show / hide toggle. */
export default function TextField({ label, hint, error, type = 'text', id, className, ...inputProps }) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? 'true' : undefined}>
        <input
          id={inputId}
          type={isPassword && passwordVisible ? 'text' : type}
          className={styles.input}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cx(hintId, errorId) || undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-controls={inputId}
            aria-label={t(passwordVisible ? 'a11y.hidePassword' : 'a11y.showPassword')}
          >
            <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
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
