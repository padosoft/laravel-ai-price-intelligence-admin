import { path, type BarSegment, type Point, type PricePoint } from './helpers';

export interface MiniSparkProps {
  data: Array<number | PricePoint>;
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

/** Inline tiny line used in table cells / KPI tiles. */
export function MiniSpark({ data, width = 96, height = 28, color = 'var(--text-secondary)', fill = true }: MiniSparkProps) {
  const values = data.map((d) => (typeof d === 'number' ? d : d.price));
  if (values.length === 0) {
    return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const pts: Point[] = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 3) - 1.5]);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {fill && <path d={`M0 ${height} ${path(pts).slice(1)} L${width} ${height} Z`} fill={color} opacity="0.1" />}
      <path d={path(pts)} fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx={last[0]} cy={last[1]} r="1.6" fill={color} />
    </svg>
  );
}

export interface StackedBarProps {
  segments: BarSegment[];
  height?: number;
}

/** Horizontal stacked bar (e.g. cheaper / parity / pricier distribution). */
export function StackedBar({ segments, height = 18 }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      style={{
        display: 'flex',
        height,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      {segments.map((s, i) => (
        <div key={i} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
      ))}
    </div>
  );
}

export interface ColumnChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** Simple column chart used for throughput-by-hour. */
export function ColumnChart({ data, width = 360, height = 96, color }: ColumnChartProps) {
  const max = Math.max(...data, 1);
  const colW = width / data.length;
  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" aria-hidden="true">
      {data.map((v, i) => {
        const h = (v / max) * (height - 8);
        return <rect key={i} x={i * colW + 1} y={height - h} width={colW - 2} height={h} fill={color ?? 'var(--text)'} opacity={0.85} />;
      })}
    </svg>
  );
}

export interface GaugeProps {
  value: number;
  label?: string;
  size?: number;
  color?: string;
}

/** Half-circle gauge for a single 0–100 value (sentiment, confidence, …). */
export function Gauge({ value, label, size = 140, color }: GaugeProps) {
  const r = size / 2 - 10;
  const c = size / 2;
  const arc = (start: number, end: number): string => {
    const sa = ((start - 90) * Math.PI) / 180;
    const ea = ((end - 90) * Math.PI) / 180;
    const x1 = c + r * Math.cos(sa);
    const y1 = c + r * Math.sin(sa);
    const x2 = c + r * Math.cos(ea);
    const y2 = c + r * Math.sin(ea);
    const large = end - start > 180 ? 1 : 0;
    return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const fillColor = color ?? (value >= 70 ? 'var(--price-pricier)' : value >= 40 ? 'var(--status-paused)' : 'var(--price-cheaper)');
  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} role="img" aria-label={label ? `${label}: ${value}` : String(value)}>
      <path d={arc(-90, 90)} fill="none" stroke="var(--bg-subtle)" strokeWidth="10" strokeLinecap="round" />
      <path d={arc(-90, -90 + (value / 100) * 180)} fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round" />
      <text x={c} y={c - 4} textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--text)" fontFamily="var(--font-mono)" letterSpacing="-0.02em">
        {value}
      </text>
      {label && (
        <text x={c} y={c + 12} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </text>
      )}
    </svg>
  );
}
