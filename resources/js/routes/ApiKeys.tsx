import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Tag } from '@/components/ds/pricing';
import { useToast } from '@/components/ds';
import { useApiKeys, useApiKeyActions } from '@/hooks/operate';
import { useAbility } from '@/state/auth-context';
import type { ApiKeyCreated } from '@/lib/api/types';

function fmtDate(s: string | null): string {
  return s ? s.slice(0, 10) : 'never';
}

export function ApiKeys() {
  const canManage = useAbility('apikeys:manage');
  const { data, isLoading } = useApiKeys(canManage);
  const keys = useMemo(() => data?.data ?? [], [data]);
  const { create, revoke } = useApiKeyActions();
  const toast = useToast();
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);

  if (!canManage) {
    return (
      <div className="page" data-testid="page-api-keys">
        <div className="page-head"><div><h1 className="page-title">API keys</h1></div></div>
        <div className="banner-soft" style={{ marginTop: 20 }}>
          <I.Shield size={16} style={{ color: 'var(--status-paused)' }} />
          <div style={{ flex: 1, fontSize: 12.5 }}>
            <b>Access denied</b> · the <span className="mono">apikeys:manage</span> ability is required to view or manage API keys.
          </div>
        </div>
      </div>
    );
  }

  const generate = () => {
    create.mutate(
      { name: 'New key', scopes: ['observations:read'] },
      {
        onSuccess: (k) => { setCreated(k); toast.push({ title: 'API key generated', body: 'Copy it now — shown once.' }); },
        onError: () => toast.push({ title: 'Generation failed', kind: 'error' }),
      },
    );
  };

  return (
    <div className="page" data-testid="page-api-keys">
      <div className="page-head">
        <div>
          <h1 className="page-title">API keys</h1>
          <p className="page-sub">Machine-to-machine auth via the <span className="mono">X-Api-Key</span> header. Scope keys narrowly — least privilege.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn primary" disabled={create.isPending} onClick={generate}><I.Plus size={13} /> Generate key</button>
        </div>      </div>

      {created && (
        <div className="banner-soft ai" style={{ marginBottom: 16 }}>
          <I.Key size={16} />
          <div style={{ flex: 1, fontSize: 12.5 }}>
            <b>New key — shown once.</b> Copy it now; it can't be retrieved later.
            <div className="mono" style={{ marginTop: 6, padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 6, wordBreak: 'break-all', userSelect: 'all' }}>{created.plaintext}</div>
          </div>
          <button type="button" className="btn sm" onClick={() => setCreated(null)}>Dismiss</button>
        </div>
      )}

      <div className="card">
        <div className="card-body flush">
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>Scopes</th><th>Last used</th><th>Created</th><th>Expires</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const now = new Date();
                const revoked = k.revoked_at != null;
                const expired = !revoked && k.expires_at != null && new Date(k.expires_at) <= now;
                const inactive = revoked || expired;
                return (
                  <tr key={k.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500, textDecoration: inactive ? 'line-through' : 'none', opacity: inactive ? 0.5 : 1 }}>{k.name}</div>
                      <div className="mono tertiary" style={{ fontSize: 10.5, marginTop: 2 }}>piprice_••••{String(k.id).slice(-4)}</div>
                    </td>
                    <td>
                      <div className="tag-list">
                        {(k.scopes ?? []).slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}
                        {(k.scopes?.length ?? 0) > 3 && <Tag>+{(k.scopes?.length ?? 0) - 3}</Tag>}
                      </div>
                    </td>
                    <td className="mono muted">{fmtDate(k.last_used_at)}</td>
                    <td className="mono muted">{fmtDate(k.created_at)}</td>
                    <td className="mono muted">{k.expires_at ? fmtDate(k.expires_at) : <span className="tertiary">never</span>}</td>
                    <td>
                      {revoked
                        ? <span className="badge failed"><span className="dot" />revoked</span>
                        : expired
                          ? <span className="badge paused"><span className="dot" />expired</span>
                          : <span className="badge success"><span className="dot" />active</span>}
                    </td>
                    <td>
                      <button type="button" className="btn sm danger" disabled={inactive || revoke.isPending} onClick={() => revoke.mutate(k.id, { onSuccess: () => toast.push({ title: 'Key revoked' }), onError: () => toast.push({ title: 'Revoke failed', kind: 'error' }) })}>Revoke</button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && keys.length === 0 && <tr><td colSpan={7} className="empty">No API keys</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="banner-soft" style={{ marginTop: 20 }}>
        <I.Shield size={16} style={{ color: 'var(--status-paused)' }} />
        <div style={{ flex: 1, fontSize: 12.5 }}>
          <b>Security</b> · keys are shown once at creation and never again. Rotate every 90 days, revoke unused keys. All requests are rate-limited per-tenant and audit-logged.
        </div>
      </div>
    </div>
  );
}
