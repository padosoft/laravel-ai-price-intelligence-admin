import type { CSSProperties, ReactNode } from 'react';
import { I } from './icons';
import { currencySymbol } from '@/lib/format';

export type PriceSize = 'md' | 'lg' | 'xl';

export interface PriceProps {
  cents: number;
  currency?: string;
  size?: PriceSize;
  strikethrough?: boolean;
}

/** Mono tabular price with currency symbol (ported from ui.jsx). */
export function Price({ cents, currency = 'EUR', size = 'md', strikethrough }: PriceProps) {
  const value = (cents / 100).toFixed(2);
  const cls = `price ${size === 'lg' ? 'large' : size === 'xl' ? 'huge' : ''}`.trim();
  const style: CSSProperties | undefined = strikethrough
    ? { textDecoration: 'line-through', color: 'var(--text-tertiary)' }
    : undefined;
  return (
    <span className={cls} style={style}>
      <span className="currency">{currencySymbol(currency)}</span>
      {value}
    </span>
  );
}

export interface PriceDeltaProps {
  pct: number;
  abs?: number | null;
  /** 'us' = compared to our price, 'prev' = compared to previous observation. */
  vs?: 'us' | 'prev';
}

/**
 * Pricing-semantic delta: competitor pricier than us = SAFE (green), cheaper = THREAT (red),
 * within ±1% = parity (grey).
 */
export function PriceDelta({ pct, abs, vs = 'us' }: PriceDeltaProps) {
  // Parity band is ±1% (matches design.css + TEMPLATE §2).
  const cls = pct > 1 ? 'pricier' : pct < -1 ? 'cheaper' : 'parity';
  const sign = pct > 0 ? '+' : '';
  const Arrow = pct > 0 ? I.ArrowUp : pct < 0 ? I.ArrowDown : null;
  return (
    <span className={`price-delta ${cls}`} title={vs === 'us' ? 'vs our price' : 'vs previous'}>
      {Arrow && <Arrow size={10} />}
      {abs != null ? `${sign}€${(abs / 100).toFixed(2)}` : `${sign}${pct.toFixed(1)}%`}
    </span>
  );
}

export interface AiBadgeProps {
  size?: 'sm' | 'lg';
  model?: string;
  children?: ReactNode;
}

/** EU AI Act Art. 50 "AI-generated" disclosure badge. */
export function AiBadge({ size, model, children = 'AI' }: AiBadgeProps) {
  return (
    <span
      className={`ai-badge ${size === 'lg' ? 'large' : ''}`.trim()}
      title={model ? `AI-generated · ${model}` : 'AI-generated content'}
    >
      <I.Sparkle size={size === 'lg' ? 12 : 10} />
      {children}
    </span>
  );
}

export interface ConfidenceBadgeProps {
  value: number;
  showBar?: boolean;
  label?: ReactNode;
}

/** Match-confidence badge 0–100, colour-graded (≥85 high, ≥60 mid, else low). */
export function ConfidenceBadge({ value, showBar = true, label }: ConfidenceBadgeProps) {
  const tier = value >= 85 ? 'high' : value >= 60 ? 'mid' : 'low';
  return (
    <span className={`conf ${tier}`}>
      {showBar && <span className="conf-bar" style={{ ['--w' as string]: `${value}%` }} />}
      <span className="num">{value}</span>
      {label && <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>}
    </span>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  IT: 'Italy', FR: 'France', DE: 'Germany', ES: 'Spain', NL: 'Netherlands',
  UK: 'United Kingdom', GB: 'United Kingdom', US: 'United States', PL: 'Poland', BE: 'Belgium',
};

/** Country chip (mono fallback letters). */
export function Flag({ code }: { code: string }) {
  const name = COUNTRY_NAMES[code] ?? code;
  return (
    <span className="flag" title={name} role="img" aria-label={name}>
      <span className="ff" aria-hidden="true">
        {code}
      </span>
    </span>
  );
}

const HOST_COLORS: Record<string, string> = {
  'amazon.it': '#ff9900', 'amazon.de': '#ff9900', 'mediaworld.it': '#e3000f',
  'unieuro.it': '#e30613', 'eprice.it': '#ed1c24', 'monclick.it': '#0066ff',
  'trovaprezzi.it': '#f59e0b', 'idealo.it': '#0070ce', 'google.com/shopping': '#4285f4',
  'ebay.it': '#86b817', 'bpm-power.com': '#1a1a1a',
};

/** Competitor host chip with a coloured letter "favicon". */
export function HostChip({ host }: { host: string }) {
  const color = HOST_COLORS[host] ?? '#52525b';
  const initial = host.charAt(0).toUpperCase();
  return (
    <span className="host-chip">
      <span className="host-favicon" style={{ background: color }}>
        {initial}
      </span>
      {host}
    </span>
  );
}

/** Tag pill (countries, domains, …). */
export function Tag({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="tag">
      {icon}
      {children}
    </span>
  );
}

/** Sidebar brand glyph (chart-arrow). */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <div className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 13l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
