import { Fragment } from 'react';
import { I } from '@/components/ds/icons';
import { fmtTime } from '@/lib/format';
import type { RouteKey, Tenant, Theme } from '@/lib/types';
import { ROUTE_TITLES } from './nav';

export interface TopbarProps {
  route: RouteKey;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  autoRefresh: boolean;
  onAutoRefresh: (next: boolean) => void;
  onOpenPalette: () => void;
  onOpenTenant: () => void;
  lastTick: number;
  alertCount: number;
  tenant: Tenant;
}

/** Top bar: tenant switcher, breadcrumbs, live pill, command palette, theme toggle. */
export function Topbar({
  route,
  theme,
  onTheme,
  autoRefresh,
  onAutoRefresh,
  onOpenPalette,
  onOpenTenant,
  lastTick,
  alertCount,
  tenant,
}: TopbarProps) {
  const crumbs = ROUTE_TITLES[route] ?? [route];

  return (
    <header className="topbar">
      <button
        className="iconbtn"
        onClick={onOpenTenant}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 8px', width: 'auto', borderRadius: 6 }}
        title="Switch tenant"
      >
        <div
          className="avatar"
          style={{ width: 18, height: 18, fontSize: 8, background: 'linear-gradient(135deg, var(--accent), var(--status-running))' }}
        >
          {tenant.code.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{tenant.name}</span>
        <I.ChevronDown size={12} />
      </button>

      <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <Fragment key={c}>
            {i > 0 && (
              <span className="sep">
                <I.ChevronRight size={11} />
              </span>
            )}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span className="muted">{c}</span>}
          </Fragment>
        ))}
      </nav>

      <div className="topbar-spacer" />

      <span className="live-pill" title="Live updates from /alerts/stream (SSE)">
        <span className="pulse" />
        <span>Live</span>
        <span style={{ marginLeft: 4 }}>· {fmtTime(lastTick)}</span>
      </span>

      <button className="search-trigger" onClick={onOpenPalette}>
        <I.Search size={13} />
        <span>Search products, competitors, hosts…</span>
        <span className="kbd">⌘K</span>
      </button>

      <button
        className="iconbtn"
        onClick={() => onAutoRefresh(!autoRefresh)}
        title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
        aria-label={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
      >
        {autoRefresh ? <I.Pause size={14} /> : <I.Play size={14} />}
      </button>
      <button className="iconbtn" title="Notifications" aria-label="Notifications" style={{ position: 'relative' }}>
        <I.Bell size={14} />
        {alertCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--status-failed)',
              border: '1.5px solid var(--bg-elevated)',
            }}
          />
        )}
      </button>
      <button
        className="iconbtn"
        onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <I.Sun size={14} /> : <I.Moon size={14} />}
      </button>
    </header>
  );
}
