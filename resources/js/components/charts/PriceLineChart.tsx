import {
  scaleLinear,
  path,
  smoothPath,
  fmtChartPrice,
  fmtChartDate,
  type Padding,
  type Point,
  type PriceSeries,
  type PromoBand,
} from './helpers';

export interface PriceLineChartProps {
  series: PriceSeries[];
  ourPrice?: number | null;
  width?: number;
  height?: number;
  promoBands?: PromoBand[];
  showAxis?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  padding?: Padding;
}

/** Multi-series price history with optional promo bands and an "our price" reference. */
export function PriceLineChart({
  series,
  ourPrice,
  width = 720,
  height = 240,
  promoBands = [],
  showAxis = true,
  showGrid = true,
  smooth = true,
  padding = { t: 12, r: 16, b: 28, l: 56 },
}: PriceLineChartProps) {
  const W = width;
  const H = height;
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;

  const allPoints = series.flatMap((s) => s.data);
  if (allPoints.length === 0) {
    return <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Price history" />;
  }
  const xs = allPoints.map((p) => p.t.getTime());
  const ys = allPoints.map((p) => p.price);
  if (ourPrice != null) ys.push(ourPrice);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys) * 0.98;
  const maxY = Math.max(...ys) * 1.02;
  const x = scaleLinear([minX, maxX], [padding.l, padding.l + innerW]);
  const y = scaleLinear([minY, maxY], [padding.t + innerH, padding.t]);

  const yTicks = 4;
  const yT = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTicks);
  const xTicks = 5;
  const xT = Array.from({ length: xTicks + 1 }, (_, i) => minX + ((maxX - minX) * i) / xTicks);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Price history">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={s.id ?? i} id={`grad-${s.id ?? i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {promoBands.map((b, i) => (
        <rect
          key={i}
          x={x(b.from.getTime())}
          y={padding.t}
          width={x(b.to.getTime()) - x(b.from.getTime())}
          height={innerH}
          fill="var(--ai-color)"
          opacity="0.06"
        />
      ))}

      {showGrid && (
        <g className="chart-grid">
          {yT.map((v, i) => (
            <line key={i} x1={padding.l} x2={padding.l + innerW} y1={y(v)} y2={y(v)} strokeOpacity={i === 0 ? 1 : 0.5} />
          ))}
        </g>
      )}

      {showAxis && (
        <g className="chart-axis">
          {yT.map((v, i) => (
            <text key={`y${i}`} x={padding.l - 8} y={y(v) + 3} textAnchor="end">
              {fmtChartPrice(v)}
            </text>
          ))}
          {xT.map((v, i) => (
            <text key={`x${i}`} x={x(v)} y={padding.t + innerH + 16} textAnchor="middle">
              {fmtChartDate(v)}
            </text>
          ))}
        </g>
      )}

      {ourPrice != null && (
        <g>
          <line
            x1={padding.l}
            x2={padding.l + innerW}
            y1={y(ourPrice)}
            y2={y(ourPrice)}
            stroke="var(--text)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.7"
          />
          <text
            x={padding.l + innerW - 4}
            y={y(ourPrice) - 6}
            textAnchor="end"
            fontSize="10"
            fill="var(--text)"
            fontFamily="var(--font-mono)"
            opacity="0.7"
          >
            our · {fmtChartPrice(ourPrice)}
          </text>
        </g>
      )}

      {series.map((s, i) => {
        const pts: Point[] = s.data.map((p) => [x(p.t.getTime()), y(p.price)]);
        const last = pts[pts.length - 1];
        const first = pts[0];
        const area =
          `M${first[0]} ${padding.t + innerH} ` +
          (smooth ? smoothPath(pts).slice(1) : pts.map((p) => `L${p[0]} ${p[1]}`).join(' ')) +
          ` L${last[0]} ${padding.t + innerH} Z`;
        return (
          <g key={s.id ?? i}>
            {!s.dashed && <path d={area} fill={`url(#grad-${s.id ?? i})`} />}
            <path
              d={smooth ? smoothPath(pts) : path(pts)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.thick ? 2 : 1.4}
              strokeDasharray={s.dashed ? '4 3' : ''}
            />
            <circle cx={last[0]} cy={last[1]} r="2.5" fill={s.color} />
          </g>
        );
      })}
    </svg>
  );
}
