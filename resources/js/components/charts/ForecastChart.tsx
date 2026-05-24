import {
  scaleLinear,
  path,
  smoothPath,
  fmtChartPrice,
  fmtChartDate,
  type ForecastPoint,
  type Padding,
  type Point,
  type PricePoint,
} from './helpers';

export interface ForecastChartProps {
  history: PricePoint[];
  forecast: ForecastPoint[];
  ourPrice?: number | null;
  width?: number;
  height?: number;
  padding?: Padding;
}

/** Historical line + dashed forecast + shaded confidence-interval band (AI-flagged). */
export function ForecastChart({
  history,
  forecast,
  ourPrice,
  width = 720,
  height = 240,
  padding = { t: 12, r: 16, b: 28, l: 56 },
}: ForecastChartProps) {
  const W = width;
  const H = height;
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;

  const allX = [...history.map((p) => p.t.getTime()), ...forecast.map((p) => p.t.getTime())];
  const allY = [
    ...history.map((p) => p.price),
    ...forecast.map((p) => p.low),
    ...forecast.map((p) => p.high),
    ...(ourPrice != null ? [ourPrice] : []),
  ];

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY) * 0.98;
  const maxY = Math.max(...allY) * 1.02;
  const x = scaleLinear([minX, maxX], [padding.l, padding.l + innerW]);
  const y = scaleLinear([minY, maxY], [padding.t + innerH, padding.t]);

  const splitX = x(history[history.length - 1].t.getTime());

  const histPts: Point[] = history.map((p) => [x(p.t.getTime()), y(p.price)]);
  const fcLine: Point[] = [...histPts.slice(-1), ...forecast.map((p): Point => [x(p.t.getTime()), y(p.price)])];
  const ciTop: Point[] = forecast.map((p) => [x(p.t.getTime()), y(p.high)]);
  const ciBot: Point[] = forecast.map((p): Point => [x(p.t.getTime()), y(p.low)]).reverse();
  const ciArea = path([...ciTop, ...ciBot]) + ' Z';

  const yTicks = 4;
  const yT = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTicks);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Price forecast">
      <path d={ciArea} fill="var(--ai-color)" opacity="0.14" />

      <rect x={splitX} y={padding.t} width={padding.l + innerW - splitX} height={innerH} fill="var(--ai-bg)" opacity="0.4" />

      <g className="chart-grid">
        {yT.map((v, i) => (
          <line key={i} x1={padding.l} x2={padding.l + innerW} y1={y(v)} y2={y(v)} />
        ))}
      </g>

      <g className="chart-axis">
        {yT.map((v, i) => (
          <text key={i} x={padding.l - 8} y={y(v) + 3} textAnchor="end">
            {fmtChartPrice(v)}
          </text>
        ))}
        <text x={padding.l} y={padding.t + innerH + 16} textAnchor="start">
          {fmtChartDate(minX)}
        </text>
        <text x={splitX} y={padding.t + innerH + 16} textAnchor="middle">
          today
        </text>
        <text x={padding.l + innerW} y={padding.t + innerH + 16} textAnchor="end">
          {fmtChartDate(maxX)}
        </text>
      </g>

      {ourPrice != null && (
        <line
          x1={padding.l}
          x2={padding.l + innerW}
          y1={y(ourPrice)}
          y2={y(ourPrice)}
          stroke="var(--text)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        />
      )}

      <path d={smoothPath(histPts)} fill="none" stroke="var(--text)" strokeWidth="1.6" />
      <path d={smoothPath(fcLine)} fill="none" stroke="var(--ai-color)" strokeWidth="1.6" strokeDasharray="5 3" />

      <line x1={splitX} x2={splitX} y1={padding.t} y2={padding.t + innerH} stroke="var(--ai-color)" strokeOpacity="0.4" strokeDasharray="2 3" />
    </svg>
  );
}
