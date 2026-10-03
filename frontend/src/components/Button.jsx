import cx from '../utils/cx.js';
import Icon from './Icon.jsx';
import Spinner from './Spinner.jsx';
import styles from './Button.module.css';

/**
 * Buttons and button-styled links. Pass `as={Link}` (with `to`) to render a router link.
 * Variants: primary, secondary, ghost, danger. Sizes: md, sm.
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Component === 'button';

  return (
    <Component
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...(isButton ? { type: 'button', disabled: disabled || loading } : {})}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Spinner size={18} decorative />
      ) : (
        icon && <Icon name={icon} size={18} className={styles.icon} />
      )}
      <span>{children}</span>
    </Component>
  );
}
