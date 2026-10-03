import { Link } from 'react-router';
import cx from '../utils/cx.js';
import Arrow from './Arrow.jsx';
import { prefersPointerEffects } from '../utils/media.js';
import styles from './InteractiveButton.module.css';

const MAGNET_PX = 4;

function onPointerMove(event) {
  if (!prefersPointerEffects()) return;
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  element.style.setProperty('--bx', `${x}px`);
  element.style.setProperty('--by', `${y}px`);
  element.style.setProperty('--tx', `${((x / rect.width) * 2 - 1) * MAGNET_PX}px`);
  element.style.setProperty('--ty', `${((y / rect.height) * 2 - 1) * MAGNET_PX * 0.6}px`);
}

function onPointerLeave(event) {
  event.currentTarget.style.setProperty('--tx', '0px');
  event.currentTarget.style.setProperty('--ty', '0px');
}

/**
 * Call-to-action with a little life: the arrow nudges forward, a soft highlight follows the
 * pointer and the button leans a few pixels towards it. Renders a router link by default.
 */
export default function InteractiveButton({
  as: Component = Link,
  variant = 'primary',
  size = 'lg',
  arrow = 'right',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cx(styles.button, styles[variant], styles[size], className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...(Component === 'button' ? { type: 'button' } : {})}
      {...props}
    >
      <span className={styles.label}>{children}</span>
      {arrow && <Arrow direction={arrow} className={cx(styles.arrow, styles[arrow])} />}
    </Component>
  );
}
