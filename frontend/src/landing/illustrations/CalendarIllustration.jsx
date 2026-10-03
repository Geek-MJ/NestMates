import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import IllustrationFrame from './IllustrationFrame.jsx';
import styles from './Illustrations.module.css';

const LEADING_BLANKS = 2;
const DAYS = 30;
const SELECTED_DAY = 18;
const LOCALES = { fr: 'fr-FR', en: 'en-GB' };

function useCalendarLabels(language) {
  return useMemo(() => {
    const locale = LOCALES[language] ?? LOCALES.en;
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // 2024-01-01 was a Monday: seven consecutive days give the localized week, Monday first.
    const weekdays = Array.from({ length: 7 }, (_, index) => weekday.format(new Date(2024, 0, 1 + index)));
    const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
      new Date(2024, 0, 1, 19, 0),
    );
    return { weekdays, time };
  }, [language]);
}

export default function CalendarIllustration({ className, style }) {
  const { t, i18n } = useTranslation();
  const { weekdays, time } = useCalendarLabels(i18n.resolvedLanguage);
  const cells = [
    ...Array.from({ length: LEADING_BLANKS }, () => null),
    ...Array.from({ length: DAYS }, (_, index) => index + 1),
  ];

  return (
    <IllustrationFrame
      icon="calendar"
      title={t('landing.illustrations.calendar.title')}
      caption={t('landing.illustrations.calendar.caption')}
      className={className}
      style={style}
    >
      <div className={styles.month}>
        {weekdays.map((day, index) => (
          <span key={`w${index}`} className={styles.weekday}>
            {day}
          </span>
        ))}
        {cells.map((day, index) =>
          day ? (
            <span key={index} className={styles.day} data-selected={day === SELECTED_DAY || undefined}>
              {day}
            </span>
          ) : (
            <span key={index} />
          ),
        )}
      </div>
      <div className={`${styles.event} ${styles.seq}`} style={{ '--at': 0.4 }}>
        <span className={styles.eventBar} />
        <span className={styles.rowText}>
          <strong>{t('landing.illustrations.calendar.event')}</strong>
          <span>
            {time} · {t('landing.illustrations.calendar.place')}
          </span>
        </span>
      </div>
    </IllustrationFrame>
  );
}
