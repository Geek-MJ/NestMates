import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon.jsx';
import { formatAmount } from '../../utils/format.js';
import IllustrationFrame from './IllustrationFrame.jsx';
import styles from './Illustrations.module.css';

const STEPS = ['record', 'calculate', 'settle'];
const TOTAL_CENTS = 4800;
const SHARES = 3;

export default function ExpenseIllustration({ className, style }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  return (
    <IllustrationFrame
      icon="expenses"
      title={t('landing.illustrations.expenses.title')}
      caption={t('landing.illustrations.expenses.caption')}
      className={className}
      style={style}
    >
      <ol className={styles.flow}>
        {STEPS.map((step, index) => (
          <li key={step} className={styles.flowStep} style={{ '--at': 0.05 + index * 0.3 }}>
            <span className={styles.flowIndex}>{index + 1}</span>
            {t(`landing.illustrations.expenses.steps.${step}`)}
          </li>
        ))}
      </ol>

      <div className={`${styles.row} ${styles.seq}`} style={{ '--at': 0.05 }}>
        <span className={styles.rowIcon}>
          <Icon name="expenses" size={16} />
        </span>
        <span className={styles.rowText}>
          <strong>{t('landing.illustrations.expenses.item')}</strong>
          <span>{t('landing.illustrations.expenses.paidBy')}</span>
        </span>
        <strong className={styles.amount}>{formatAmount(TOTAL_CENTS, language)}</strong>
      </div>

      <div className={`${styles.split} ${styles.seq}`} style={{ '--at': 0.35 }}>
        <span className={styles.splitLabel}>
          {t('landing.illustrations.expenses.split', { count: SHARES })}
        </span>
        <div className={styles.splitBars}>
          {Array.from({ length: SHARES }, (_, index) => (
            <span key={index} className={styles.splitBar} style={{ '--at': 0.38 + index * 0.06 }}>
              <span className={styles.dot} data-tone={index} />
              {formatAmount(TOTAL_CENTS / SHARES, language)}
            </span>
          ))}
        </div>
      </div>

      <div className={`${styles.settled} ${styles.seq}`} style={{ '--at': 0.68 }}>
        <Icon name="checkCircle" size={18} />
        {t('landing.illustrations.expenses.settled')}
      </div>
    </IllustrationFrame>
  );
}
