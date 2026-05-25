import { useEffect, useState } from 'react';
import { I, type IconName } from '@/components/ds/icons';
import { useToast } from '@/components/ds';
import { useAuth } from '@/state/auth-context';
import { useUpdateSettings } from '@/hooks/operate';
import type { TenantSettings } from '@/lib/api/types';

type SectionKey = 'general' | 'currency' | 'scraping' | 'storage' | 'notifications' | 'ai';
const SECTIONS: Array<{ key: SectionKey; label: string; icon: IconName }> = [
  { key: 'general', label: 'General', icon: 'Settings' },
  { key: 'currency', label: 'Currency & FX', icon: 'Tag' },
  { key: 'scraping', label: 'Scraping policy', icon: 'Globe' },
  { key: 'storage', label: 'Storage & retention', icon: 'Folder' },
  { key: 'notifications', label: 'Notification channels', icon: 'Bell' },
  { key: 'ai', label: 'AI providers', icon: 'Brain' },
];

const NOTES: Record<Exclude<SectionKey, 'general' | 'ai' | 'notifications'>, { title: string; body: string }> = {
  currency: { title: 'Currency & FX', body: 'Base currency and the pluggable FX provider (fixer.io / openexchangerates) are set in the core config (price-intelligence.currency). Observations are normalised to the base currency at capture time.' },
  scraping: { title: 'Scraping policy', body: 'robots.txt is respected by default; per-domain opt-out is audit-logged. Per-domain rate limits, UA rotation and the rendering driver (search-provider / Browsershot) are configured in the core (price-intelligence.compliance / .scraping).' },
  storage: { title: 'Storage & retention', body: 'Time-series tables are partitioned monthly; raw retention defaults to 90 days with continuous daily aggregates kept indefinitely (price-intelligence.storage).' },
};

const CHANNELS: Array<{ key: keyof NonNullable<TenantSettings['channels']>; label: string }> = [
  { key: 'webhook', label: 'Webhook' },
  { key: 'mail', label: 'Email' },
  { key: 'slack', label: 'Slack' },
  { key: 'teams', label: 'Microsoft Teams' },
];

export function Settings() {
  const { me } = useAuth();
  const [section, setSection] = useState<SectionKey>('general');
  const features = me?.features ?? {};
  const settings = me?.tenant.settings ?? {};
  const update = useUpdateSettings();
  const toast = useToast();

  // Local editable drafts, re-seeded whenever the server identity changes (e.g. after save).
  const [alertEmail, setAlertEmail] = useState('');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [channels, setChannels] = useState<NonNullable<TenantSettings['channels']>>({});
  useEffect(() => {
    setAlertEmail(settings.alert_email ?? '');
    setDensity(settings.density ?? 'comfortable');
    setChannels({ ...settings.channels });
    // Re-seed on identity change only; `settings` is a fresh object each render so key on its JSON.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(settings)]);

  const save = (patch: TenantSettings, label: string) =>
    update.mutate(patch, {
      onSuccess: () => toast.push({ title: 'Settings saved', body: label }),
      onError: () => toast.push({ title: 'Save failed', body: 'Settings were not changed.', kind: 'error' }),
    });

  const generalDirty = alertEmail !== (settings.alert_email ?? '') || density !== (settings.density ?? 'comfortable');
  const channelsDirty = JSON.stringify(channels) !== JSON.stringify(settings.channels ?? {});

  return (
    <div className="page" data-testid="page-settings">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Tenant-level configuration. Editable preferences write to the core via PATCH /tenants/me/settings; infrastructure values stay in the core config.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="card-body flush">
            {SECTIONS.map((s) => {
              const IconCmp = I[s.icon];
              const isSel = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  className="cell-open-btn"
                  aria-current={isSel ? 'true' : undefined}
                  onClick={() => setSection(s.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: isSel ? 'var(--bg-active)' : undefined, borderLeft: isSel ? '2px solid var(--text)' : '2px solid transparent', fontSize: 13, fontWeight: isSel ? 500 : 400, color: isSel ? 'var(--text)' : 'var(--text-secondary)' }}
                >
                  <IconCmp size={14} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {section === 'general' && (
              <>
                <div className="kpi-label" style={{ marginBottom: 12 }}>Tenant</div>
                <div className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between' }}><span className="group-label">Name</span><span className="mono">{me?.tenant.name ?? '—'}</span></div>
                <div className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between' }}><span className="group-label">Code</span><span className="mono">{me?.tenant.code ?? '—'}</span></div>
                <div className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between' }}><span className="group-label">ID</span><span className="mono">{String(me?.tenant.id ?? '—')}</span></div>

                <div className="kpi-label" style={{ margin: '20px 0 12px' }}>Preferences</div>
                <div className="form-row">
                  <label htmlFor="set-alert-email">Alert email</label>
                  <input
                    id="set-alert-email"
                    type="email"
                    className="input"
                    value={alertEmail}
                    placeholder="pricing-ops@example.com"
                    onChange={(e) => setAlertEmail(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="set-density">Table density</label>
                  <select id="set-density" className="select" value={density} onChange={(e) => setDensity(e.target.value as 'comfortable' | 'compact')}>
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!generalDirty || update.isPending}
                    onClick={() => save({ alert_email: alertEmail, density }, 'General preferences')}
                  >
                    <I.Check size={13} /> Save changes
                  </button>
                </div>
              </>
            )}

            {section === 'notifications' && (
              <>
                <div className="kpi-label" style={{ marginBottom: 8 }}>Notification channels</div>
                <p className="muted" style={{ margin: '0 0 14px', fontSize: 12.5, lineHeight: 1.6 }}>Alerts dispatch via Laravel Notifications. Toggle which channels this tenant receives; routing credentials are configured in the core.</p>
                {CHANNELS.map((c) => (
                  <div key={c.key} className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor={`chan-${c.key}`} className="group-label" style={{ margin: 0 }}>{c.label}</label>
                    <input
                      id={`chan-${c.key}`}
                      type="checkbox"
                      checked={channels[c.key] ?? false}
                      onChange={(e) => setChannels((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    />
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!channelsDirty || update.isPending}
                    onClick={() => save({ channels }, 'Notification channels')}
                  >
                    <I.Check size={13} /> Save changes
                  </button>
                </div>
              </>
            )}

            {section === 'ai' && (
              <>
                <div className="kpi-label" style={{ marginBottom: 12 }}>AI feature flags (resolved from /tenants/me)</div>
                {Object.entries(features).map(([k, on]) => (
                  <div key={k} className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span className="group-label">{k}</span>
                    <span className={`badge ${on ? 'success' : 'outline'}`} style={{ fontSize: 10 }}><span className="dot" />{on ? 'enabled' : 'off'}</span>
                  </div>
                ))}
                {Object.keys(features).length === 0 && <div className="empty">No feature flags resolved.</div>}
              </>
            )}

            {section !== 'general' && section !== 'ai' && section !== 'notifications' && (
              <>
                <div className="kpi-label" style={{ marginBottom: 8 }}>{NOTES[section].title}</div>
                <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>{NOTES[section].body}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
