import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { AiBadge } from '@/components/ds/pricing';
import { useCatalog, useContentGaps } from '@/hooks/operate';

export function ContentGap() {
  const { data, isLoading } = useContentGaps();
  const gaps = useMemo(() => data?.data ?? [], [data]);
  const catalog = useCatalog();
  const productName = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of catalog.data?.data ?? []) m.set(p.id, p.name);
    return m;
  }, [catalog.data]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = gaps.find((g) => g.id === selectedId) ?? gaps[0] ?? null;

  return (
    <div className="page" data-testid="page-content-gap">
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Content gap analysis
            <AiBadge size="lg" />
          </h1>
          <p className="page-sub">What competitors say about a SKU that you don't. LLM SEO recommendations grounded on scraped content.</p>
        </div>
      </div>

      <div className="grid-21">
        <div className="card">
          <div className="card-head"><h3 className="card-title">Products with gaps</h3></div>
          <div className="card-body flush">
            {gaps.map((g) => {
              const isSel = selected?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  className="cell-open-btn"
                  aria-current={isSel ? 'true' : undefined}
                  onClick={() => setSelectedId(g.id)}
                  style={{
                    display: 'block', width: '100%', padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: isSel ? 'var(--bg-active)' : 'transparent',
                    borderLeft: isSel ? '2px solid var(--text)' : '2px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{productName.get(g.product_id) ?? `Product #${g.product_id}`}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <span className="mono muted" style={{ fontSize: 11 }}>SEO Δ</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--price-cheaper)' }}>{g.seo_score_delta}</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>{(g.missing_attributes ?? []).length} gaps</span>
                  </div>
                </button>
              );
            })}
            {gaps.length === 0 && <div className="empty">{isLoading ? 'Loading…' : 'No content gaps'}</div>}
          </div>
        </div>

        <div>
          {selected ? (
            <div className="card">
              <div className="card-head">
                <div>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {productName.get(selected.product_id) ?? `Product #${selected.product_id}`}
                    <AiBadge />
                  </h3>
                  <p className="card-sub">LLM-generated recommendations</p>
                </div>
                <div className="stat">
                  <small>SEO score delta</small>
                  <b style={{ color: 'var(--price-cheaper)' }}>{selected.seo_score_delta}</b>
                </div>
              </div>
              <div className="card-body">
                <div className="form-row">
                  <span className="group-label">Missing or weak attributes</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {(selected.missing_attributes ?? []).map((m, i) => (
                      <div key={i} className="banner-soft" style={{ padding: 10, fontSize: 12.5 }}>
                        <I.AlertTriangle size={14} style={{ color: 'var(--status-paused)', marginTop: 1 }} />
                        <span>{m}</span>
                      </div>
                    ))}
                    {(selected.missing_attributes ?? []).length === 0 && <span className="muted">None flagged.</span>}
                  </div>
                </div>

                <div className="form-row">
                  <span className="group-label">Title recommendations</span>
                  {(selected.title_recommendations ?? []).map((t, i) => (
                    <div key={i} style={{ padding: 12, background: 'var(--ai-bg)', border: '1px solid var(--ai-border)', borderRadius: 6, fontSize: 13, marginTop: 6 }}>
                      <I.Sparkle size={13} style={{ color: 'var(--ai-color)', marginRight: 6, verticalAlign: 'text-top' }} />
                      {t}
                    </div>
                  ))}
                </div>

                <div className="form-row">
                  <span className="group-label">Description rewrite</span>
                  {(selected.description_recommendations ?? []).map((d, i) => (
                    <div key={i} style={{ padding: 12, background: 'var(--ai-bg)', border: '1px solid var(--ai-border)', borderRadius: 6, fontSize: 13, marginTop: 6 }}>
                      <I.Sparkle size={13} style={{ color: 'var(--ai-color)', marginRight: 6, verticalAlign: 'text-top' }} />
                      {d}
                    </div>
                  ))}
                </div>

                <div className="form-row">
                  <span className="group-label">Image count gap</span>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--price-cheaper)' }}>+{selected.image_count_gap}</div>
                  <small className="muted">images to add to match competitor coverage</small>
                </div>
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body empty">No content gaps available.</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
