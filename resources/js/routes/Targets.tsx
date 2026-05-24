import { useState } from 'react';
import { I } from '@/components/ds/icons';
import { Flag } from '@/components/ds/pricing';
import { useToast } from '@/components/ds';
import { useTargets, useTargetActions } from '@/hooks/operate';
import { fmtNum } from '@/lib/format';
import type { TargetStatus } from '@/lib/api/types';

const STATUS_BADGE: Record<TargetStatus, string> = { active: 'success', paused: 'paused', stopped: 'failed' };
const FILTERS: Array<TargetStatus | 'all'> = ['all', 'active', 'paused', 'stopped'];

export function Targets() {
  const [status, setStatus] = useState<TargetStatus | 'all'>('all');
  const { data, isLoading } = useTargets(status);
  const { scrapeNow, setStatus: setTargetStatus } = useTargetActions();
  const toast = useToast();
  const targets = data?.data ?? [];

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
          <button type="button" className="btn primary">
            <I.Plus size={13} /> New target
          </button>
        </div>
      </div>

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
