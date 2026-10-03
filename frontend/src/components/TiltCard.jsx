import cx from '../utils/cx.js';
import { prefersPointerEffects } from '../utils/media.js';
import styles from './TiltCard.module.css';

const MAX_TILT_DEG = 3;

function onPointerMove(event) {
  if (!prefersPointerEffects()) return;
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  element.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
  element.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
  element.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
  element.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
}

function onPointerLeave(event) {
  event.currentTarget.style.setProperty('--rx', '0deg');
  event.currentTarget.style.setProperty('--ry', '0deg');
}

/** Surface that tilts slightly towards the pointer, with a soft highlight under it. */
export default function TiltCard({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cx(styles.card, className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...props}
    >
      {children}
    </Component>
  );
}
