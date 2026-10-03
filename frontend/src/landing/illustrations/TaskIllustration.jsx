import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon.jsx';
import IllustrationFrame from './IllustrationFrame.jsx';
import styles from './Illustrations.module.css';

function Task({ label, done, className }) {
  return (
    <li className={`${styles.task} ${className ?? ''}`} data-done={done || undefined}>
      <span className={styles.checkbox}>
        <Icon name="check" size={14} strokeWidth={2.5} />
      </span>
      {label}
    </li>
  );
}

export default function TaskIllustration({ className, style }) {
  const { t } = useTranslation();
  const label = (key) => t(`landing.illustrations.tasks.items.${key}`);

  return (
    <IllustrationFrame
      icon="tasks"
      title={t('landing.illustrations.tasks.title')}
      caption={t('landing.illustrations.tasks.caption')}
      className={className}
      style={style}
    >
      <div className={styles.board}>
        <div className={styles.column}>
          <span className={styles.columnTitle}>{t('landing.illustrations.tasks.todo')}</span>
          <ul className={styles.taskList}>
            <Task label={label('kitchen')} className={styles.taskMoving} />
            <Task label={label('recycling')} className={styles.taskShift} />
            <Task label={label('laundry')} className={styles.taskShift} />
          </ul>
        </div>
        <div className={styles.column}>
          <span className={styles.columnTitle}>{t('landing.illustrations.tasks.done')}</span>
          <ul className={styles.taskList}>
            <Task label={label('plants')} done />
          </ul>
        </div>
      </div>
    </IllustrationFrame>
  );
}
