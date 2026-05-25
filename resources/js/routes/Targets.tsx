import { useState } from 'react';
import { I } from '@/components/ds/icons';
import { Flag } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { useCatalog, useTargets, useTargetActions } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { TargetStatus } from '@/lib/api/types';

const STATUS_BADGE: Record<TargetStatus, string> = { active: 'success', paused: 'paused', stopped: 'failed' };
const FILTERS: Array<TargetStatus | 'all'> = ['all', 'active', 'paused', 'stopped'];
const FREQUENCIES = ['hourly', '4h', 'daily', 'weekly'];

export function Targets() {
  const [status, setStatus] = useState<TargetStatus | 'all'>('all');
  const { data, isLoading } = useTargets(status);
  const { scrapeNow, setStatus: setTargetStatus, create } = useTargetActions();
  const catalog = useCatalog();
  const products = catalog.data?.data ?? [];
  const toast = useToast();
  const targets = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<number | ''>('');
  const [country, setCountry] = useState('IT');
  const [frequency, setFrequency] = useState('daily');
  const resetForm = () => { setProductId(''); setCountry('IT'); setFrequency('daily'); };

  const submit = () => {
    if (productId === '' || country.trim().length !== 2) return;
    // Capture submitted values (inputs stay editable while pending).
    const submittedProductId = Number(productId);
    const submittedCountry = country.trim().toUpperCase();
    create.mutate(
      { product_id: submittedProductId, country: submittedCountry, frequency },
      {
        onSuccess: () => { toast.push({ title: 'Target created', body: `Product #${submittedProductId} · ${submittedCountry}` }); setOpen(false); resetForm(); },
        onError: () => toast.push({ title: 'Could not create target', kind: 'error' }),
      },
    );
  };

  const onScrape = (id: number) =>
    scrapeNow.mutate(id, {
      onSuccess: (res) => toast.push({ title: 'Scrape queued', body: `${res.data.queued} competitor(s)` }),
      onError: () => toast.push({ title: 'Scrape failed', kind: 'error' }),
    });

  const onToggle = (id: number, current: TargetStatus) => {
    const next = current === 'active' ? 'paused' : 'active';
    setTargetStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast.push({ title: next === 'paused' ? 'Target paused' : 'Target resumed' }),
        onError: () => toast.push({ title: 'Update failed', kind: 'error' }),
      },
    );
  };

  return (
    <div className="page" data-testid="page-targets">
      <div className="page-head">
        <div>
          <h1 className="page-title">Monitoring targets</h1>
          <p className="page-sub">{fmtNum(targets.length)} targets · adaptive backoff reduces scrape load on stable prices.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn primary" onClick={() => setOpen(true)}>
            <I.Plus size={13} /> New target
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New monitoring target"
        sub="Track a catalog SKU in a given market. Discovery runs on the configured cadence."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={productId === '' || country.trim().length !== 2 || create.isPending} onClick={submit}>
              {create.isPending ? 'Creating…' : 'Create target'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="nt-product">Product</label>
          <select id="nt-product" className="select" value={productId} onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Select a product…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="nt-country">Country (ISO-2)</label>
          <input id="nt-country" className="input" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="IT" />
        </div>
        <div className="form-row">
          <label htmlFor="nt-frequency">Frequency</label>
          <select id="nt-frequency" className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </Modal>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`chip ${status === f ? 'active' : ''}`} onClick={() => setStatus(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Target</th>
                <th>Country</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Last check</th>
                <th>Next check</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Product #{t.product_id}</div>
                    <div className="mono tertiary" style={{ fontSize: 11, marginTop: 2 }}>target {t.id}</div>
                  </td>
                  <td>
                    <Flag code={t.country} />
                  </td>
                  <td>
                    <span className="badge outline">{t.frequency_preset}</span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[t.status]}`}>
                      <span className="dot" />
                      {t.status}
                    </span>
                  </td>
                  <td className="mono muted">{t.last_check_at ? t.last_check_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td className="mono muted">{t.next_check_at ? t.next_check_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="btn sm ghost" title="Scrape now" aria-label="Scrape now" onClick={() => onScrape(t.id)}>
                        <I.Refresh size={11} />
                      </button>
                      <button
                        type="button"
                        className="btn sm ghost"
                        title={t.status === 'active' ? 'Pause' : 'Resume'}
                        aria-label={t.status === 'active' ? 'Pause' : 'Resume'}
                        onClick={() => onToggle(t.id, t.status)}
                      >
                        {t.status === 'active' ? <I.Pause size={11} /> : <I.Play size={11} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && targets.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No targets</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
