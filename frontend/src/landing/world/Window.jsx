import { C } from './palette.js';

/**
 * Window with frame, sill and mullions. `glow` paints a lit interior (seen from outside),
 * otherwise the glass shows the soft daylight sky (seen from inside).
 */
export default function Window({ x, y, width, height, columns = 2, rows = 1, glow = false, frame = C.cream }) {
  const inset = 7;
  const columnLines = Array.from({ length: columns - 1 }, (_, index) => x + ((index + 1) * width) / columns);
  const rowLines = Array.from({ length: rows - 1 }, (_, index) => y + ((index + 1) * height) / rows);

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="4" fill={frame} />
      <rect
        x={x + inset}
        y={y + inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="2"
        fill={glow ? 'url(#nm-glow)' : 'url(#nm-glass)'}
      />
      {!glow && (
        <path
          d={`M${x + inset + 10} ${y + height - inset - 14}l${width * 0.35} ${-height * 0.45}`}
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {columnLines.map((lineX) => (
        <rect key={`c${lineX}`} x={lineX - 3} y={y + inset} width="6" height={height - inset * 2} fill={frame} />
      ))}
      {rowLines.map((lineY) => (
        <rect key={`r${lineY}`} x={x + inset} y={lineY - 3} width={width - inset * 2} height="6" fill={frame} />
      ))}
      <rect x={x - 8} y={y + height - 2} width={width + 16} height="9" rx="2" fill={frame} />
      <rect x={x - 8} y={y + height + 6} width={width + 16} height="3" fill={C.shadow} />
    </g>
  );
}
