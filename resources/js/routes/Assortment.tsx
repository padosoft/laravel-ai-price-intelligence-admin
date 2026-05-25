import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Treemap, type TreemapItem } from '@/components/charts';
import { useToast } from '@/components/ds';
import { useAssortmentGaps } from '@/hooks/operate';
import { saveBlob } from '@/lib/api/client';
import { toCsv } from '@/lib/csv';
import { safeHttpUrl } from '@/lib/url';
import type { AssortmentGap } from '@/lib/api/types';

interface CategoryAgg {
  category: string;
  count: number;
  score: number;
  gaps: AssortmentGap[];
}

export function Assortment() {
  const { data, isLoading } = useAssortmentGaps();
  const gaps = useMemo(() => data?.data ?? [], [data]);

  const categories = useMemo<CategoryAgg[]>(() => {
    const m = new Map<string, CategoryAgg>();
    for (const g of gaps) {
      const c = m.get(g.category_path) ?? { category: g.category_path, count: 0, score: 0, gaps: [] };
      c.count += 1;
      c.score = Math.max(c.score, g.importance_score);
      c.gaps.push(g);
      m.set(g.category_path, c);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [gaps]);

  const [focused, setFocused] = useState<string | null>(null);
  const focusedCat = categories.find((c) => c.category === focused) ?? null;
  const treemapItems: TreemapItem[] = categories.map((c) => ({ id: c.category, label: c.category, value: c.count, score: c.score }));

  const toast = useToast();
  const onExport = () => {
    // Export the already-loaded gaps as CSV client-side (the core has no assortment :export
    // endpoint; this serializes real data, not synthetic).
    const csv = toCsv(
      ['category_path', 'title', 'competitor_product_url', 'importance_score', 'status'],
      gaps.map((g) => [g.category_path, g.title, g.competitor_product_url, g.importance_score, g.status]),
    );
    saveBlob(new Blob([csv], { type: 'text/csv' }), 'assortment-gaps.csv');
    toast.push({ title: 'Export ready', body: 'assortment-gaps.csv' });
  };

  return (
    <div className="page" data-testid="page-assortment">
      <div className="page-head">
        <div>
          <h1 className="page-title">Assortment gaps</h1>
          <p className="page-sub">Categories where competitors list SKUs you don't. Click a tile to focus its category.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" disabled={gaps.length === 0} onClick={onExport}><I.External size={13} /> Export</button>
        </div>
      </div>

      <div className="grid-12">
        <div className="card">
          <div className="card-head">
            <div className="treemap-crumbs">
              <button type="button" className="cell-open-btn" onClick={() => setFocused(null)} style={{ textDecoration: focused ? 'underline' : 'none' }}>
                All categories
              </button>
              {focused && (<><I.ChevronRight size={11} /> <b>{focused}</b></>)}
            </div>
            <span className="muted" style={{ fontSize: 11 }}>Color = importance · Area = gap count</span>
          </div>
          <div className="card-body" style={{ padding: 14 }}>
            {treemapItems.length > 0 ? (
              <Treemap items={treemapItems} width={720} height={380} focusedId={focused ?? undefined} onSelect={(id) => setFocused(id === focused ? null : id)} />
            ) : (
              <div className="empty">No assortment gaps</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Top categories</h3>
            <span className="muted">{focused ? '1 selected' : `${categories.length} total`}</span>
          </div>
          <div className="card-body flush">
            {categories.map((c) => {
              const isSel = focused === c.category;
              return (
                <button
                  key={c.category}
                  type="button"
                  className="cell-open-btn"
                  aria-pressed={isSel}
                  onClick={() => setFocused(isSel ? null : c.category)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isSel ? '2px solid var(--text)' : '2px solid transparent',
                    background: isSel ? 'var(--bg-active)' : 'transparent',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      score <span className="mono" style={{ color: 'var(--text-secondary)' }}>{c.score}</span>
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{c.count}</div>
                </button>
              );
            })}
            {categories.length === 0 && <div className="empty">{isLoading ? 'Loading…' : 'No categories'}</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h3 className="card-title">{focused ? `Detail · ${focused}` : 'Detail · pick a category to drill down'}</h3>
          <span className="muted">{focusedCat ? `${focusedCat.count} competitor SKUs not in your catalog` : ''}</span>
        </div>
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th className="center">Importance</th>
                <th>Status</th>
                <th>Listing</th>
              </tr>
            </thead>
            <tbody>
              {(focusedCat?.gaps ?? gaps).map((g) => {
                const href = safeHttpUrl(g.competitor_product_url);
                return (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 500, fontSize: 12.5 }}>{g.title ?? '—'}</td>
                    <td className="muted">{g.category_path}</td>
                    <td className="center mono">{g.importance_score}</td>
                    <td><span className={`badge ${g.status === 'open' ? 'paused' : 'pending'}`}><span className="dot" />{g.status}</span></td>
                    <td>
                      {href
                        ? <a className="id-link mono" href={href} target="_blank" rel="noreferrer noopener" style={{ fontSize: 11 }}>open</a>
                        : '—'}
                    </td>
                  </tr>
                );
              })}
              {gaps.length === 0 && <tr><td colSpan={5} className="empty">No gaps</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
