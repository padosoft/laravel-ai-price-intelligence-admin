import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, AiBadge, ConfidenceBadge, HostChip } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { ProductImg } from '@/components/screens/shared';
import { useCompetitors, useCompetitorActions, useHostFacets, useTargets } from '@/hooks/operate';
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

  // Host chips use EXACT per-host counts from the SQL facet endpoint (scales to 500k SKU; not a
  // count of the single loaded page).
  const facetsQuery = useHostFacets();
  const facets = useMemo(() => facetsQuery.data ?? [], [facetsQuery.data]);
  const hostCounts = useMemo(() => new Map(facets.map((f) => [f.host, f.count])), [facets]);
  const totalListings = useMemo(() => facets.reduce((sum, f) => sum + f.count, 0), [facets]);
  const hosts = useMemo(() => ['all', ...facets.map((f) => f.host)], [facets]);

  const targetsQuery = useTargets('all');
  const targets = targetsQuery.data?.data ?? [];
  const { addByUrl, discover } = useCompetitorActions();
  const toast = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | ''>('');
  const [url, setUrl] = useState('');
  const [discoverTargetId, setDiscoverTargetId] = useState<number | ''>('');

  const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

  const submitAdd = () => {
    const submittedUrl = url.trim();
    if (targetId === '' || !isHttpUrl(submittedUrl)) return;
    // Capture submitted values (inputs stay editable while pending).
    const submittedTargetId = Number(targetId);
    addByUrl.mutate(
      { monitoring_target_id: submittedTargetId, url: submittedUrl },
      {
        onSuccess: () => { toast.push({ title: 'Competitor added', body: submittedUrl }); setAddOpen(false); setUrl(''); setTargetId(''); },
        onError: () => toast.push({ title: 'Could not add competitor', kind: 'error' }),
      },
    );
  };

  const submitDiscover = () => {
    if (discoverTargetId === '') return;
    const submittedTargetId = Number(discoverTargetId);
    discover.mutate(submittedTargetId, {
      onSuccess: () => { toast.push({ title: 'Discovery queued', body: `target #${submittedTargetId}` }); setDiscoverOpen(false); setDiscoverTargetId(''); },
      onError: () => toast.push({ title: 'Could not queue discovery', kind: 'error' }),
    });
  };

  return (
    <div className="page" data-testid="page-competitors">
      <div className="page-head">
        <div>
          <h1 className="page-title">Competitors</h1>
          <p className="page-sub">{fmtNum(totalListings)} confirmed competitor listings across {facets.length} hosts.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => setAddOpen(true)}>
            <I.Plus size={13} /> Add by URL
          </button>
          <button type="button" className="btn primary" onClick={() => setDiscoverOpen(true)}>
            <I.Refresh size={13} /> Trigger discovery
          </button>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add competitor by URL"
        sub="Manually attach a confirmed competitor listing (match confidence 100, method: manual) to a monitoring target."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={targetId === '' || !isHttpUrl(url) || addByUrl.isPending} onClick={submitAdd}>
              {addByUrl.isPending ? 'Adding…' : 'Add competitor'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="ac-target">Monitoring target</label>
          <select id="ac-target" className="select" value={targetId} onChange={(e) => setTargetId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Select a target…</option>
            {targets.map((t) => <option key={t.id} value={t.id}>#{t.id} · Product #{t.product_id} · {t.country}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ac-url">Listing URL</label>
          <input id="ac-url" className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://competitor.example/p/123" />
        </div>
      </Modal>

      <Modal
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        title="Trigger discovery"
        sub="Queue a background job that searches the configured marketplaces/search providers for new competitor URLs for the chosen target."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDiscoverOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={discoverTargetId === '' || discover.isPending} onClick={submitDiscover}>
              {discover.isPending ? 'Queuing…' : 'Queue discovery'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="dc-target">Monitoring target</label>
          <select id="dc-target" className="select" value={discoverTargetId} onChange={(e) => setDiscoverTargetId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Select a target…</option>
            {targets.map((t) => <option key={t.id} value={t.id}>#{t.id} · Product #{t.product_id} · {t.country}</option>)}
          </select>
        </div>
      </Modal>

      <div className="filter-bar">
        {hosts.map((h) => (
          <button key={h} type="button" className={`chip ${host === h ? 'active' : ''}`} onClick={() => setHost(h)}>
            {h === 'all' ? 'All hosts' : h}
            <span className="count">{h === 'all' ? totalListings : (hostCounts.get(h) ?? 0)}</span>
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
                  return (
                    <tr key={c.id} onClick={open} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductImg img={product?.brand?.slice(0, 2)} />
                          <div>
                            <button
                              type="button"
                              className="cell-open-btn"
                              aria-label={`Open ${product?.name ?? c.url}`}
                              onClick={(e) => { e.stopPropagation(); open(); }}
                            >
                              {product?.name ?? '—'}
                            </button>
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
