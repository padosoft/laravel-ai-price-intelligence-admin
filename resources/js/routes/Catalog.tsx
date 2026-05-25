import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { I } from '@/components/ds/icons';
import { Price, Tag } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { useCatalog, useCatalogActions, useCsvExport } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { RouteKey } from '@/lib/types';

export function Catalog({ onNavigate }: { onNavigate: (r: RouteKey, params?: Record<string, unknown>) => void }) {
  const { data, isLoading } = useCatalog();
  const products = useMemo(() => data?.data ?? [], [data]);
  const { createSku, importCsv } = useCatalogActions();
  const csvExport = useCsvExport();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const onExport = () =>
    csvExport.mutate(
      { path: '/catalog/products:export', filename: 'catalog.csv' },
      { onSuccess: () => toast.push({ title: 'Export ready', body: 'catalog.csv' }), onError: () => toast.push({ title: 'Export failed', kind: 'error' }) },
    );

  const [open, setOpen] = useState(false);
  const [externalId, setExternalId] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [priceEuros, setPriceEuros] = useState('');
  const resetForm = () => { setExternalId(''); setName(''); setSku(''); setBrandInput(''); setPriceEuros(''); };

  const submitSku = () => {
    if (externalId.trim() === '' || name.trim() === '') return;
    const cents = priceEuros.trim() === '' ? undefined : Math.round(Number(priceEuros) * 100);
    createSku.mutate(
      {
        external_id: externalId.trim(),
        name: name.trim(),
        sku: sku.trim() || undefined,
        brand: brandInput.trim() || undefined,
        our_price_cents: Number.isFinite(cents) ? cents : undefined,
        currency: cents != null ? 'EUR' : undefined,
      },
      {
        onSuccess: () => { toast.push({ title: 'SKU created', body: name.trim() }); setOpen(false); resetForm(); },
        onError: () => toast.push({ title: 'Could not create SKU', kind: 'error' }),
      },
    );
  };

  const onPickCsv = (file: File | undefined) => {
    if (!file) return;
    importCsv.mutate(file, {
      onSuccess: () => toast.push({ title: 'CSV import queued', body: file.name }),
      onError: () => toast.push({ title: 'CSV import failed', kind: 'error' }),
    });
  };
  // Precompute brand counts once (O(n)) instead of filtering per chip in render.
  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    return counts;
  }, [products]);
  const brands = useMemo(() => ['all', ...brandCounts.keys()], [brandCounts]);
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
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            data-testid="csv-input"
            style={{ display: 'none' }}
            onChange={(e) => { onPickCsv(e.target.files?.[0]); e.target.value = ''; }}
          />
          <button type="button" className="btn" disabled={csvExport.isPending} onClick={onExport}>
            <I.External size={13} /> {csvExport.isPending ? 'Exporting…' : 'Export CSV'}
          </button>
          <button type="button" className="btn" disabled={importCsv.isPending} onClick={() => fileInput.current?.click()}>
            <I.External size={13} /> {importCsv.isPending ? 'Importing…' : 'Import CSV'}
          </button>
          <button type="button" className="btn primary" onClick={() => setOpen(true)}>
            <I.Plus size={13} /> New SKU
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New SKU"
        sub="Add a single product to the catalog. external_id is the stable host identifier used for upserts."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={externalId.trim() === '' || name.trim() === '' || createSku.isPending} onClick={submitSku}>
              {createSku.isPending ? 'Saving…' : 'Create SKU'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="sku-external">External ID</label>
          <input id="sku-external" className="input" value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="ACX1P-128" />
        </div>
        <div className="form-row">
          <label htmlFor="sku-name">Name</label>
          <input id="sku-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme X1 Pro 128GB Smartphone" />
        </div>
        <div className="form-row">
          <label htmlFor="sku-sku">SKU</label>
          <input id="sku-sku" className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="optional" />
        </div>
        <div className="form-row">
          <label htmlFor="sku-brand">Brand</label>
          <input id="sku-brand" className="input" value={brandInput} onChange={(e) => setBrandInput(e.target.value)} placeholder="optional" />
        </div>
        <div className="form-row">
          <label htmlFor="sku-price">Our price (EUR)</label>
          <input id="sku-price" className="input" type="number" min={0} step="0.01" value={priceEuros} onChange={(e) => setPriceEuros(e.target.value)} placeholder="799.00" />
        </div>
      </Modal>

      <div className="filter-bar">
        {brands.map((b) => (
          <button
            key={b}
            type="button"
            className={`chip ${brand === b ? 'active' : ''}`}
            onClick={() => setBrand(b)}
          >
            {b === 'all' ? 'All brands' : b}
            <span className="count">{b === 'all' ? products.length : (brandCounts.get(b) ?? 0)}</span>
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
                  <tr key={p.id} role="button" aria-label={`Open ${p.name}`} tabIndex={0} onClick={nav} onKeyDown={handleKey}>
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
