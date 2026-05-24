export type Point = [number, number];

/** Linear scale from a numeric domain to a pixel range. */
export function scaleLinear(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0 || 1);
  return (v) => r0 + (v - d0) * m;
}

/** Straight-segment SVG path from points. */
export function path(points: Point[]): string {
  return points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
}

/** Smoothed (cubic) SVG path from points. */
export function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export const fmtChartPrice = (v: number): string => '€' + (v / 100).toFixed(0);
export const fmtChartDate = (t: number): string =>
  new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export interface Padding {
  t: number;
  r: number;
  b: number;
  l: number;
}

export interface PricePoint {
  t: Date;
  price: number;
}

export interface PriceSeries {
  id?: string;
  name: string;
  color: string;
  data: PricePoint[];
  dashed?: boolean;
  thick?: boolean;
}

export interface PromoBand {
  from: Date;
  to: Date;
}

export interface ForecastPoint {
  t: Date;
  price: number;
  low: number;
  high: number;
}

export interface ScatterPoint {
  t: Date;
  price: number;
  anomaly?: boolean;
  sev?: 'high' | 'medium' | 'low';
  label?: string;
}

export interface TreemapItem {
  id?: string;
  label: string;
  value: number;
  score: number;
}

export interface BarSegment {
  label: string;
  value: number;
  color: string;
}

export interface CompetitorPricePoint {
  name: string;
  price: number;
}
