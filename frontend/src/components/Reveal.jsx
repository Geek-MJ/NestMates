import useReveal from '../hooks/useReveal.js';
import cx from '../utils/cx.js';

/** Fades its content in the first time it scrolls into view. */
export default function Reveal({ as: Component = 'div', delay = 0, className, style, children, ...props }) {
  const [ref, revealed] = useReveal();

  return (
    <Component
      ref={ref}
      className={cx('reveal', className)}
      data-revealed={revealed}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Component>
  );
}
