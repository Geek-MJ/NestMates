import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon.jsx';
import IllustrationFrame from './IllustrationFrame.jsx';
import styles from './Illustrations.module.css';

/**
 * A message written in one language with its translation underneath. The original is read
 * from that language's resources and the translation from the other, whatever the UI language.
 */
function TranslatedBubble({ messageKey, from, to, side, at }) {
  const { t } = useTranslation();

  return (
    <div className={`${styles.bubble} ${styles.seq}`} data-side={side} style={{ '--at': at }}>
      <span className={styles.bubbleDot} data-side={side} />
      <div className={styles.bubbleBody}>
        <p className={styles.bubbleOriginal} lang={from}>
          {t(messageKey, { lng: from })}
        </p>
        <div className={`${styles.translation} ${styles.seq}`} style={{ '--at': at + 0.18 }}>
          <span className={styles.translationLabel}>
            <Icon name="refresh" size={12} strokeWidth={2.25} />
            {t(`landing.illustrations.chat.translatedFrom.${from}`)}
          </span>
          <p lang={to}>{t(messageKey, { lng: to })}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatIllustration({ className, style }) {
  const { t } = useTranslation();

  return (
    <IllustrationFrame
      icon="chat"
      title={t('landing.illustrations.chat.title')}
      caption={t('landing.illustrations.chat.caption')}
      className={className}
      style={style}
      aside={<span className={styles.langChip}>{t('landing.illustrations.chat.languages')}</span>}
    >
      <div className={styles.thread}>
        <TranslatedBubble messageKey="landing.illustrations.chat.question" from="en" to="fr" side="start" at={0.02} />
        <TranslatedBubble messageKey="landing.illustrations.chat.reply" from="fr" to="en" side="end" at={0.45} />
      </div>
    </IllustrationFrame>
  );
}
