import Icon from '../../components/Icon.jsx';
import cx from '../../utils/cx.js';
import styles from './Illustrations.module.css';

/**
 * Card around a product scene. The visible content is a stylized example, not real
 * household data, and is replaced by a caption for screen readers.
 */
export default function IllustrationFrame({ icon, title, caption, aside, className, style, children }) {
  return (
    <figure className={cx(styles.frame, className)} style={style}>
      <div className={styles.head} aria-hidden="true">
        <span className={styles.title}>
          <Icon name={icon} size={16} />
          {title}
        </span>
        {aside}
      </div>
      <div className={styles.body} aria-hidden="true">
        {children}
      </div>
      <figcaption className="visually-hidden">{caption}</figcaption>
    </figure>
  );
}
