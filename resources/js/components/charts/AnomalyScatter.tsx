import { scaleLinear, fmtChartPrice, fmtChartDate, type Padding, type ScatterPoint } from './helpers';

export interface AnomalyScatterProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  padding?: Padding;
}

function dotColor(d: ScatterPoint): string {
  if (!d.anomaly) return 'var(--text-secondary)';
  if (d.sev === 'high') return 'var(--price-cheaper)';
  if (d.sev === 'medium') return 'var(--status-paused)';
  return 'var(--text-tertiary)';
}

/** Detrended price scatter with the normal p5–p95 band and highlighted anomalies. */
export function AnomalyScatter({ data, width = 720, height = 220, padding = { t: 10, r: 10, b: 28, l: 48 } }: AnomalyScatterProps) {
  if (data.length === 0) {
    return <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Price anomalies" />;
  }
  const W = width;
  const H = height;
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;
  const xs = data.map((d) => d.t.getTime());
  const ys = data.map((d) => d.price);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys) * 0.97;
  const maxY = Math.max(...ys) * 1.03;
  const x = scaleLinear([minX, maxX], [padding.l, padding.l + innerW]);
  const y = scaleLinear([minY, maxY], [padding.t + innerH, padding.t]);

  const sortedY = [...ys].sort((a, b) => a - b);
  const p5 = sortedY[Math.floor(sortedY.length * 0.05)];
  const p95 = sortedY[Math.floor(sortedY.length * 0.95)];
  const median = sortedY[Math.floor(sortedY.length * 0.5)];

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Price anomalies">
      <rect x={padding.l} y={y(p95)} width={innerW} height={y(p5) - y(p95)} fill="var(--text)" opacity="0.04" />
      <line x1={padding.l} x2={padding.l + innerW} y1={y(median)} y2={y(median)} stroke="var(--text-tertiary)" strokeDasharray="2 3" strokeWidth="1" />
      <text x={padding.l + innerW - 4} y={y(median) - 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
        median
      </text>
      <text x={padding.l + innerW - 4} y={y(p5) - 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
        p5
      </text>
      <text x={padding.l + innerW - 4} y={y(p95) + 12} textAnchor="end" fontSize="10" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
        p95
      </text>

      <g className="chart-axis">
        {[minY, median, maxY].map((v, i) => (
          <text key={i} x={padding.l - 8} y={y(v) + 3} textAnchor="end">
            {fmtChartPrice(v)}
          </text>
        ))}
        <text x={padding.l} y={padding.t + innerH + 16} textAnchor="start">
          {fmtChartDate(minX)}
        </text>
        <text x={padding.l + innerW} y={padding.t + innerH + 16} textAnchor="end">
          {fmtChartDate(maxX)}
        </text>
      </g>

      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(d.t.getTime())}
          cy={y(d.price)}
          r={d.anomaly ? 5 : 2.5}
          className="scatter-dot"
          fill={dotColor(d)}
          opacity={d.anomaly ? 0.95 : 0.5}
        />
      ))}

      {data
        .filter((d) => d.anomaly && d.label)
        .map((d, i) => (
          <g key={`l-${i}`}>
            <line x1={x(d.t.getTime())} y1={y(d.price)} x2={x(d.t.getTime())} y2={y(d.price) - 18} stroke="var(--text-tertiary)" strokeWidth="0.5" />
            <text
              x={x(d.t.getTime())}
              y={y(d.price) - 22}
              fontSize="10"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fill={d.sev === 'high' ? 'var(--price-cheaper)' : 'var(--status-paused)'}
            >
              {d.label}
            </text>
          </g>
        ))}
    </svg>
  );
}
