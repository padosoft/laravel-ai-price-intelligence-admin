import type { KeyboardEvent, ReactNode } from 'react';
import { I } from '@/components/ds/icons';
import { AiBadge } from '@/components/ds/pricing';
import { MiniSpark } from '@/components/charts';
import type { Alert } from '@/lib/api/types';

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sparkData?: number[];
  sparkColor?: string;
}

/** KPI tile with optional delta + inline sparkline (ported from pages-a.jsx). */
export function KpiTile({ label, value, delta, trend, sparkData, sparkColor }: KpiTileProps) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta && (
        <div className={`kpi-delta ${trend ?? 'flat'}`}>
          {trend === 'up' && <I.ArrowUp size={10} />}
          {trend === 'down' && <I.ArrowDown size={10} />}
          <span>{delta}</span>
        </div>
      )}
      {sparkData && (
        <div className="kpi-spark">
          <MiniSpark data={sparkData} color={sparkColor ?? 'var(--text)'} width={96} height={32} />
        </div>
      )}
    </div>
  );
}

/** Striped product image placeholder. */
export function ProductImg({ img, lg }: { img?: string; lg?: boolean }) {
  return (
    <div className={`product-img ${lg ? 'lg' : ''} stripes`}>
      <span className="placeholder">{img || '⛶'}</span>
    </div>
  );
}

function alertIconKind(type: string): string {
  if (type.includes('price.dropped') || type.includes('undercut') || type.includes('buybox') || type.includes('map.violated')) return 'cheaper';
  if (type.includes('price.raised')) return 'pricier';
  if (type.includes('stock') || type.includes('promo')) return 'stock';
  if (type.includes('anomaly') || type.includes('match.') || type.includes('repricing')) return 'ai';
  return 'stock';
}

function alertIcon(type: string) {
  if (type.includes('stock.out')) return I.AlertTriangle;
  if (type.includes('promo')) return I.Tag;
  if (type.includes('buybox')) return I.Briefcase;
  if (type.includes('anomaly')) return I.Anomaly;
  if (type.includes('match.')) return I.Compare;
  if (type.includes('map.')) return I.Shield;
  if (type.includes('competitor.url_dead')) return I.External;
  if (type.includes('repricing')) return I.Wrench;
  if (type.includes('price.dropped') || type.includes('undercut')) return I.ArrowDown;
  return I.Tag;
}

const SEV_BADGE: Record<string, string> = { high: 'failed', medium: 'paused', low: 'pending' };

/** Live alert feed row (shared by Dashboard + Alerts inbox). */
export function AlertFeedRow({ alert, fresh, onClick }: { alert: Alert; fresh?: boolean; onClick?: () => void }) {
  const Icon = alertIcon(alert.type);
  const isAi = alert.type.includes('anomaly') || alert.type.includes('match.') || alert.type.includes('repricing');
  const host = (alert.payload?.host as string | undefined) ?? '';
  const handleKey = onClick
    ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }
    : undefined;
  return (
    <div
      className={`alert-item ${fresh ? 'new' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKey}
    >
      <div className={`alert-icon ${alertIconKind(alert.type)}`}>
        <Icon size={14} />
      </div>
      <div className="alert-body">
        <div className="alert-title">
          {alert.type}
          {isAi && <AiBadge />}
        </div>
        <div className="alert-meta">
          <span style={{ color: 'var(--text-secondary)' }}>{host}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className={`badge ${SEV_BADGE[alert.severity] ?? 'pending'}`}>
          <span className="dot" />
          {alert.severity}
        </span>
      </div>
    </div>
  );
}
