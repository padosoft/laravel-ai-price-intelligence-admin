import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Tag } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { useWebhooks, useWebhookActions } from '@/hooks/operate';

const PAYLOAD_SAMPLE = `POST /webhooks/price-intel HTTP/1.1
Host: marginos.acme.it
X-PI-Signature: sha256=a31b7c8d…
Content-Type: application/json

{
  "id": "evt_2b8c91a",
  "event": "undercut.detected",
  "occurred_at": "2026-05-24T11:34:18Z",
  "is_ai_generated": false,
  "data": { "product_id": 1, "host": "trovaprezzi.it", "delta_pct": -6.25 }
}`;

export function Webhooks() {
  const { data, isLoading } = useWebhooks();
  const rows = useMemo(() => data?.data ?? [], [data]);
  const { test, remove, create } = useWebhookActions();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('');
  const [secret, setSecret] = useState('');

  const isHttpsUrl = (v: string) => /^https:\/\/\S+$/i.test(v.trim());

  const submit = () => {
    if (!isHttpsUrl(url)) return;
    const eventList = events.split(',').map((e) => e.trim()).filter(Boolean);
    create.mutate(
      // Omit events when blank so the core applies its `['*']` (all events) default — matches
      // the modal copy. Sending `[]` would instead subscribe to nothing.
      { url: url.trim(), events: eventList.length > 0 ? eventList : undefined, secret: secret.trim() || undefined },
      {
        onSuccess: () => { toast.push({ title: 'Subscription created', body: url.trim() }); setOpen(false); setUrl(''); setEvents(''); setSecret(''); },
        onError: () => toast.push({ title: 'Could not create subscription', kind: 'error' }),
      },
    );
  };

  return (
    <div className="page" data-testid="page-webhooks">
      <div className="page-head">
        <div>
          <h1 className="page-title">Webhook subscriptions</h1>
          <p className="page-sub">
            Outbound events signed with HMAC-SHA256 (<span className="mono">X-PI-Signature</span>). Retry: exponential backoff, 5 attempts.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn primary" onClick={() => setOpen(true)}><I.Plus size={13} /> New subscription</button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New webhook subscription"
        sub="Events are signed with HMAC-SHA256 (X-PI-Signature). Leave events blank to receive all (*)."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={!isHttpsUrl(url) || create.isPending} onClick={submit}>
              {create.isPending ? 'Creating…' : 'Create subscription'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="wh-url">Endpoint URL (https)</label>
          <input id="wh-url" className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://marginos.acme.it/webhooks/price-intel" />
        </div>
        <div className="form-row">
          <label htmlFor="wh-events">Events (comma-separated)</label>
          <input id="wh-events" className="input" value={events} onChange={(e) => setEvents(e.target.value)} placeholder="undercut.detected, repricing.suggested" />
        </div>
        <div className="form-row">
          <label htmlFor="wh-secret">Signing secret</label>
          <input id="wh-secret" className="input" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="optional — used for X-PI-Signature" />
        </div>
      </Modal>

      <div className="card">
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr><th>Endpoint</th><th>Events</th><th>Status</th><th>Last delivery</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{w.url}</div>
                    <div className="mono tertiary" style={{ fontSize: 10.5, marginTop: 2 }}>#{w.id}</div>
                  </td>
                  <td>
                    <div className="tag-list">
                      {(w.events ?? []).slice(0, 3).map((e) => <Tag key={e}>{e}</Tag>)}
                      {(w.events?.length ?? 0) > 3 && <Tag>+{(w.events?.length ?? 0) - 3}</Tag>}
                    </div>
                  </td>
                  <td><span className={`badge ${w.active ? 'success' : 'failed'}`}><span className="dot" />{w.active ? 'active' : 'disabled'}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {w.last_status != null && <span className={`badge ${w.last_status < 300 ? 'success' : 'failed'}`} style={{ fontSize: 10 }}>{w.last_status}</span>}
                      <span className="mono muted" style={{ fontSize: 11 }}>{w.last_at ? w.last_at.slice(0, 16).replace('T', ' ') : '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="btn sm" disabled={test.isPending} onClick={() => test.mutate(w.id, { onSuccess: () => toast.push({ title: 'Test event sent', body: w.url }), onError: () => toast.push({ title: 'Test failed', kind: 'error' }) })}>Test</button>
                      <button type="button" className="btn sm danger" disabled={remove.isPending} onClick={() => remove.mutate(w.id, { onSuccess: () => toast.push({ title: 'Subscription removed' }), onError: () => toast.push({ title: 'Remove failed', kind: 'error' }) })}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="empty">No webhook subscriptions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head"><h3 className="card-title">Payload sample</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          <pre className="code-block" style={{ borderRadius: 0, border: 0, fontSize: 11 }}>{PAYLOAD_SAMPLE}</pre>
        </div>
      </div>
    </div>
  );
}
