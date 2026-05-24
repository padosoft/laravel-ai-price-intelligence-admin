import { scaleLinear, type CompetitorPricePoint, type Padding } from './helpers';

export interface PriceDistributionProps {
  ourPrice?: number | null;
  competitors: CompetitorPricePoint[];
  width?: number;
  height?: number;
}

const PADDING: Padding = { t: 18, r: 16, b: 28, l: 16 };

/** Horizontal distribution of competitor prices vs ours (cheaper = threat, pricier = safe). */
export function PriceDistribution({ ourPrice, competitors, width = 720, height = 80 }: PriceDistributionProps) {
  const allPrices = competitors.map((c) => c.price);
  if (ourPrice != null) allPrices.push(ourPrice);
  if (allPrices.length === 0) {
    return <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Competitor price distribution" />;
  }
  const minP = Math.min(...allPrices) * 0.985;
  const maxP = Math.max(...allPrices) * 1.015;
  const x = scaleLinear([minP, maxP], [PADDING.l, width - PADDING.r]);
  const baselineY = PADDING.t + 8;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Competitor price distribution">
      <line x1={PADDING.l} x2={width - PADDING.r} y1={baselineY} y2={baselineY} stroke="var(--border-strong)" strokeWidth="1" />

      {ourPrice != null && (
        <g>
          <line x1={x(ourPrice)} x2={x(ourPrice)} y1={PADDING.t - 4} y2={baselineY + 12} stroke="var(--text)" strokeWidth="2" />
          <text x={x(ourPrice)} y={PADDING.t - 8} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text)" fontWeight="600">
            you · €{(ourPrice / 100).toFixed(2)}
          </text>
        </g>
      )}

      {competitors.map((c, i) => {
        const cheaper = ourPrice != null && c.price < ourPrice * 0.995;
        const pricier = ourPrice != null && c.price > ourPrice * 1.005;
        const color = cheaper ? 'var(--price-cheaper)' : pricier ? 'var(--price-pricier)' : 'var(--text-secondary)';
        return (
          <g key={i}>
            <circle cx={x(c.price)} cy={baselineY} r="6" fill={color} opacity="0.9" />
            <text x={x(c.price)} y={baselineY + 22} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-tertiary)">
              {c.name}
            </text>
          </g>
        );
      })}

      <text x={PADDING.l} y={baselineY + 38} fontSize="10" fontFamily="var(--font-mono)" fill="var(--price-cheaper)">
        ← cheaper (threat)
      </text>
      <text x={width - PADDING.r} y={baselineY + 38} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--price-pricier)">
        pricier (safe) →
      </text>
    </svg>
  );
}
