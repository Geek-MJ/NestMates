import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon.jsx';
import IllustrationFrame from './IllustrationFrame.jsx';
import styles from './Illustrations.module.css';

/* Each sheet moves from a loose pile (0) to its place in an organized row (1). */
const SHEETS = [
  { key: 'lease', tone: 0, from: [18, 14, -9], to: [-96, 0, -3] },
  { key: 'insurance', tone: 1, from: [-6, 4, 7], to: [0, -8, 0] },
  { key: 'household', tone: 2, from: [6, -6, -2], to: [96, 0, 3] },
];

export default function DocumentIllustration({ className, style }) {
  const { t } = useTranslation();

  return (
    <IllustrationFrame
      icon="documents"
      title={t('landing.illustrations.documents.title')}
      caption={t('landing.illustrations.documents.caption')}
      className={className}
      style={style}
    >
      <div className={styles.desk}>
        {SHEETS.map(({ key, tone, from, to }) => (
          <div
            key={key}
            className={styles.sheet}
            data-tone={tone}
            style={{
              '--x0': from[0],
              '--y0': from[1],
              '--r0': from[2],
              '--x1': to[0],
              '--y1': to[1],
              '--r1': to[2],
            }}
          >
            <span className={styles.sheetIcon}>
              <Icon name="documents" size={18} />
            </span>
            <strong>{t(`landing.illustrations.documents.${key}`)}</strong>
            <span className={styles.sheetLines} />
            <span className={styles.sheetType}>{t('landing.illustrations.documents.type')}</span>
          </div>
        ))}
      </div>
      <div className={`${styles.shared} ${styles.seq}`} style={{ '--at': 0.72 }}>
        <Icon name="household" size={16} />
        {t('landing.illustrations.documents.shared')}
      </div>
    </IllustrationFrame>
  );
}
