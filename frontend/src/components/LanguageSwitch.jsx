import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';
import cx from '../utils/cx.js';
import styles from './LanguageSwitch.module.css';

/** FR / EN segmented switch. */
export default function LanguageSwitch({ value, onChange, disabled = false, className }) {
  const { t } = useTranslation();
  const activeIndex = Math.max(SUPPORTED_LANGUAGES.indexOf(value), 0);

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cx(styles.switch, className)}
      style={{ '--active-index': activeIndex }}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          className={styles.option}
          disabled={disabled}
          aria-pressed={value === language}
          aria-label={t(`language.names.${language}`)}
          onClick={() => onChange(language)}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
