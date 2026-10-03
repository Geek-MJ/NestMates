import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from './Icon.jsx';
import styles from './Modal.module.css';

/**
 * Accessible modal built on the native <dialog> element: focus is trapped by the browser,
 * Escape and backdrop clicks call `onClose`.
 */
export default function Modal({ open, onClose, title, description, children, footer }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t('a11y.close')}
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
