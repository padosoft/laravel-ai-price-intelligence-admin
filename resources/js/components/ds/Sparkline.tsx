export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

/** Inline area+line sparkline (ported from ui.jsx). */
export function Sparkline({ data, color, height = 32, width = 96 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const stroke = color ?? 'var(--accent)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon points={areaPoints} fill={stroke} opacity="0.12" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
