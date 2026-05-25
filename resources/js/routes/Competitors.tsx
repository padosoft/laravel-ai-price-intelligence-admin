import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, AiBadge, ConfidenceBadge, HostChip } from '@/components/ds/pricing';
import { ProductImg } from '@/components/screens/shared';
import { useCompetitors } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { CompetitorListItem } from '@/lib/api/types';
import type { RouteKey } from '@/lib/types';

const AI_METHODS = new Set(['visual', 'llm_judge']);

function stockBadge(available: boolean | null | undefined): { cls: string; label: string } {
  if (available === true) return { cls: 'success', label: 'in stock' };
  if (available === false) return { cls: 'failed', label: 'out' };
  return { cls: 'pending', label: '—' };
}

function vsUsPct(item: CompetitorListItem): number | null {
  const our = item.target?.product?.our_price_cents;
  const price = item.latest_price?.price_cents;
  if (our == null || our === 0 || price == null) return null;
  return ((price - our) / our) * 100;
}

export function Competitors({ onNavigate }: { onNavigate: (r: RouteKey, params?: Record<string, unknown>) => void }) {
  const [host, setHost] = useState<string>('all');
  const { data, isLoading } = useCompetitors(host === 'all' ? undefined : host);
  const rows = useMemo(() => data?.data ?? [], [data]);

  // Host chips are derived from the full (unfiltered) listing — fetched once with no host filter.
  const allQuery = useCompetitors();
  const all = useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);
  const hostCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of all) {
      const h = c.source?.host;
      if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
    }
    return counts;
  }, [all]);
  const hosts = useMemo(() => ['all', ...hostCounts.keys()], [hostCounts]);

  return (
    <div className="page" data-testid="page-competitors">
      <div className="page-head">
        <div>
          <h1 className="page-title">Competitors</h1>
          <p className="page-sub">{fmtNum(all.length)} confirmed competitor listings across {hostCounts.size} hosts.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn">
            <I.Plus size={13} /> Add by URL
          </button>
          <button type="button" className="btn primary">
            <I.Refresh size={13} /> Trigger discovery
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {hosts.map((h) => (
          <button key={h} type="button" className={`chip ${host === h ? 'active' : ''}`} onClick={() => setHost(h)}>
            {h === 'all' ? 'All hosts' : h}
            <span className="count">{h === 'all' ? all.length : (hostCounts.get(h) ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Host</th>
                  <th>Matched to</th>
                  <th className="center">Confidence</th>
                  <th>Method</th>
                  <th className="right">Price</th>
                  <th className="right">vs us</th>
                  <th>Stock</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const product = c.target?.product;
                  const pct = vsUsPct(c);
                  const stock = stockBadge(c.latest_price?.available);
                  const open = () => onNavigate('competitor_detail', { competitorId: c.id });
                  const onKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
                  };
                  return (
                    <tr key={c.id} role="button" tabIndex={0} aria-label={`Open ${product?.name ?? c.url}`} onClick={open} onKeyDown={onKey}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductImg img={product?.brand?.slice(0, 2)} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{product?.name ?? '—'}</div>
                            <div className="mono tertiary" style={{ fontSize: 10.5, marginTop: 1 }}>{c.url}</div>
                          </div>
                        </div>
                      </td>
                      <td>{c.source?.host ? <HostChip host={c.source.host} /> : '—'}</td>
                      <td className="muted">{product?.model ?? '—'}</td>
                      <td className="center">{c.match_confidence != null ? <ConfidenceBadge value={c.match_confidence} /> : '—'}</td>
                      <td>
                        <span className="mono" style={{ fontSize: 11 }}>{c.match_method ?? '—'}</span>
                        {c.match_method && AI_METHODS.has(c.match_method) && <AiBadge />}
                      </td>
                      <td className="right">{c.latest_price?.price_cents != null ? <Price cents={c.latest_price.price_cents} /> : '—'}</td>
                      <td className="right">{pct != null ? <PriceDelta pct={pct} /> : '—'}</td>
                      <td>
                        <span className={`badge ${stock.cls}`}>
                          <span className="dot" />
                          {stock.label}
                        </span>
                      </td>
                      <td className="mono muted">{c.last_seen_at ? c.last_seen_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                    </tr>
                  );
                })}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty">No competitor listings</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
