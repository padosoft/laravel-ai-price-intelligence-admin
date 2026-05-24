import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { I } from '@/components/ds/icons';
import { Price, Tag } from '@/components/ds/pricing';
import { useCatalog } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { RouteKey } from '@/lib/types';

export function Catalog({ onNavigate }: { onNavigate: (r: RouteKey, params?: Record<string, unknown>) => void }) {
  const { data, isLoading } = useCatalog();
  const products = useMemo(() => data?.data ?? [], [data]);
  const brands = useMemo(() => ['all', ...new Set(products.map((p) => p.brand).filter(Boolean) as string[])], [products]);
  const [brand, setBrand] = useState('all');

  const filtered = brand === 'all' ? products : products.filter((p) => p.brand === brand);

  return (
    <div className="page" data-testid="page-catalog">
      <div className="page-head">
        <div>
          <h1 className="page-title">Catalog</h1>
          <p className="page-sub">{fmtNum(products.length)} SKUs synced from the host catalog.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn">
            <I.External size={13} /> Import CSV
          </button>
          <button type="button" className="btn primary">
            <I.Plus size={13} /> New SKU
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {brands.map((b) => (
          <button
            key={b}
            type="button"
            className={`chip ${brand === b ? 'active' : ''}`}
            onClick={() => setBrand(b)}
          >
            {b === 'all' ? 'All brands' : b}
            <span className="count">{b === 'all' ? products.length : products.filter((p) => p.brand === b).length}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU · GTIN</th>
                  <th>Brand</th>
                  <th className="right">Our price</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const nav = () => onNavigate('competitor_detail', { product: p.id });
                  const handleKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(); }
                  };
                  return (
                  <tr key={p.id} tabIndex={0} onClick={nav} onKeyDown={handleKey}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                      <div className="mono tertiary" style={{ fontSize: 11, marginTop: 2 }}>
                        {p.model ?? '—'}
                      </div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 12 }}>{p.sku ?? '—'}</div>
                      <div className="mono tertiary" style={{ fontSize: 10.5, marginTop: 2 }}>{p.gtin ?? '—'}</div>
                    </td>
                    <td className="muted">{p.brand ?? '—'}</td>
                    <td className="right">{p.our_price_cents != null ? <Price cents={p.our_price_cents} /> : '—'}</td>
                    <td>{p.base_country ? <Tag>{p.base_country}</Tag> : '—'}</td>
                  </tr>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">No products</td>
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
