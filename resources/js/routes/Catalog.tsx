import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { I } from '@/components/ds/icons';
import { Price, Tag } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { VirtualTable } from '@/components/VirtualTable';
import { useBrandFacets, useCatalogActions, useCatalogInfinite, useCsvExport } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { RouteKey } from '@/lib/types';

export function Catalog({ onNavigate }: { onNavigate: (r: RouteKey, params?: Record<string, unknown>) => void }) {
  const { createSku, importCsv } = useCatalogActions();
  const brandFacetsQuery = useBrandFacets();
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
    // Capture submitted values up-front (inputs stay editable while the request is pending).
    const submittedName = name.trim();
    if (externalId.trim() === '' || submittedName === '') return;
    const rawCents = priceEuros.trim() === '' ? undefined : Math.round(Number(priceEuros) * 100);
    // Only send a price (and its currency) when it parses to a finite number; an unparseable
    // entry leaves both undefined so we never attach a currency without a price.
    const priceCents = Number.isFinite(rawCents) ? rawCents : undefined;
    createSku.mutate(
      {
        external_id: externalId.trim(),
        name: submittedName,
        sku: sku.trim() || undefined,
        brand: brandInput.trim() || undefined,
        our_price_cents: priceCents,
        currency: priceCents != null ? 'EUR' : undefined,
      },
      {
        onSuccess: () => { toast.push({ title: 'SKU created', body: submittedName }); setOpen(false); resetForm(); },
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
  // Brand chips use EXACT per-brand counts from the SQL facet endpoint (scales past page 1).
  const brandFacets = useMemo(() => brandFacetsQuery.data ?? [], [brandFacetsQuery.data]);
  const brandCounts = useMemo(() => new Map(brandFacets.map((f) => [f.brand, f.count])), [brandFacets]);
  const totalSkus = useMemo(() => brandFacets.reduce((sum, f) => sum + f.count, 0), [brandFacets]);
  const brands = useMemo(() => ['all', ...brandFacets.map((f) => f.brand)], [brandFacets]);
  const [brand, setBrand] = useState('all');

  // Cursor-paginated, virtualized list (server-side brand filter). Pages are flattened for the
  // virtualizer; infinite scroll fetches the next cursor as the user nears the end.
  const list = useCatalogInfinite(brand);
  const listRows = useMemo(() => list.data?.pages.flatMap((p) => p.data) ?? [], [list.data]);

  return (
    <div className="page" data-testid="page-catalog">
      <div className="page-head">
        <div>
          <h1 className="page-title">Catalog</h1>
          <p className="page-sub">{fmtNum(totalSkus)} SKUs synced from the host catalog.</p>
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
            <span className="count">{b === 'all' ? totalSkus : (brandCounts.get(b) ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <VirtualTable
            rows={listRows}
            colCount={5}
            testId="catalog-list"
            ariaLabel="Catalog products"
            hasNextPage={list.hasNextPage}
            isFetchingNextPage={list.isFetchingNextPage}
            onLoadMore={() => list.fetchNextPage()}
            head={(
              <tr>
                <th>Product</th>
                <th>SKU · GTIN</th>
                <th>Brand</th>
                <th className="right">Our price</th>
                <th>Country</th>
              </tr>
            )}
            empty={!list.isLoading ? <tr><td colSpan={5} className="empty">No products</td></tr> : undefined}
            renderRow={(p) => {
              // Product-centric destination: the Prices explorer preselected to this SKU.
              const nav = () => onNavigate('prices', { productId: p.id });
              const handleKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(); }
              };
              return (
                <tr key={p.id} role="button" aria-label={`Open ${p.name}`} tabIndex={0} onClick={nav} onKeyDown={handleKey}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    <div className="mono tertiary" style={{ fontSize: 11, marginTop: 2 }}>{p.model ?? '—'}</div>
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
            }}
          />
        </div>
      </div>
    </div>
  );
}
