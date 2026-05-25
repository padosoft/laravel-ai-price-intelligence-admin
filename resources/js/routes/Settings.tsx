import { useState } from 'react';
import { I, type IconName } from '@/components/ds/icons';
import { useAuth } from '@/state/auth-context';

type SectionKey = 'general' | 'currency' | 'scraping' | 'storage' | 'notifications' | 'ai';
const SECTIONS: Array<{ key: SectionKey; label: string; icon: IconName }> = [
  { key: 'general', label: 'General', icon: 'Settings' },
  { key: 'currency', label: 'Currency & FX', icon: 'Tag' },
  { key: 'scraping', label: 'Scraping policy', icon: 'Globe' },
  { key: 'storage', label: 'Storage & retention', icon: 'Folder' },
  { key: 'notifications', label: 'Notification channels', icon: 'Bell' },
  { key: 'ai', label: 'AI providers', icon: 'Brain' },
];

const NOTES: Record<Exclude<SectionKey, 'general' | 'ai'>, { title: string; body: string }> = {
  currency: { title: 'Currency & FX', body: 'Base currency and the pluggable FX provider (fixer.io / openexchangerates) are set in the core config (price-intelligence.currency). Observations are normalised to the base currency at capture time.' },
  scraping: { title: 'Scraping policy', body: 'robots.txt is respected by default; per-domain opt-out is audit-logged. Per-domain rate limits, UA rotation and the rendering driver (search-provider / Browsershot) are configured in the core (price-intelligence.compliance / .scraping).' },
  storage: { title: 'Storage & retention', body: 'Time-series tables are partitioned monthly; raw retention defaults to 90 days with continuous daily aggregates kept indefinitely (price-intelligence.storage).' },
  notifications: { title: 'Notification channels', body: 'Alerts dispatch via Laravel Notifications: webhook, mail, Slack, Teams and DB. Channel routing is configured per-tenant in the core.' },
};

export function Settings() {
  const { me } = useAuth();
  const [section, setSection] = useState<SectionKey>('general');
  const features = me?.features ?? {};

  return (
    <div className="page" data-testid="page-settings">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Tenant-level configuration. Values are managed in the core config and shown here read-only.</p>
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
            {section !== 'general' && section !== 'ai' && (
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
