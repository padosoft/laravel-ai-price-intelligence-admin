import { I } from '@/components/ds/icons';
import { BrandMark } from '@/components/ds/pricing';
import type { NavCounts, RouteKey, Tenant, TenantFeatures, User } from '@/lib/types';
import { NAV_GROUPS, isFeatureVisible } from './nav';

export interface SidebarProps {
  route: RouteKey;
  onNavigate: (route: RouteKey) => void;
  counts?: NavCounts;
  features?: TenantFeatures;
  user: User;
  tenant: Tenant;
}

/** Left navigation rail (ported from shell.jsx Sidebar). */
export function Sidebar({ route, onNavigate, counts = {}, features = {}, user, tenant }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark size={26} />
        <div className="brand-text">
          <span>price-intel</span>
          <small>padosoft · v1.0</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-section" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => {
              if (!isFeatureVisible(features, item.feature)) return null;
              const IconCmp = I[item.icon] ?? I.Hash;
              const badge = item.badgeKey ? counts[item.badgeKey] : null;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`nav-item ${route === item.key ? 'active' : ''}`}
                  aria-current={route === item.key ? 'page' : undefined}
                  onClick={() => onNavigate(item.key)}
                >
                  <IconCmp size={15} className="icon" />
                  <span>{item.label}</span>
                  {badge != null && badge > 0 && (
                    <span className={`badge ${item.badgeKey === 'alerts' ? 'danger' : ''}`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{user.initials}</div>
          <div className="user-info">
            <b>{user.name}</b>
            <small>
              {user.role} · {tenant.code}
            </small>
          </div>
        </div>
        <button type="button" className="iconbtn" title="Account" aria-label="Account">
          <I.ChevronDown size={14} />
        </button>
      </div>
    </aside>
  );
}
