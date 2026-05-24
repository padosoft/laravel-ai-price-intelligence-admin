import { Modal } from '@/components/ds';
import type { Tenant } from '@/lib/types';

export interface TenantSwitcherProps {
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSelect?: (tenant: Tenant) => void;
}

/** Modal to switch the active tenant (ported from shell.jsx). */
export function TenantSwitcher({ open, onClose, tenants, onSelect }: TenantSwitcherProps) {
  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Switch tenant"
      sub={`Your account has access to ${tenants.length} tenant${tenants.length === 1 ? '' : 's'}.`}
      footer={
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tenants.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 6,
              width: '100%',
              textAlign: 'left',
              border: t.current ? '1px solid var(--text)' : '1px solid var(--border)',
              background: t.current ? 'var(--bg-active)' : 'var(--bg-elevated)',
              cursor: 'pointer',
            }}
            onClick={() => {
              onSelect?.(t);
              onClose();
            }}
          >
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {t.id.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {t.id}
                {t.plan ? ` · ${t.plan}` : ''}
              </div>
            </div>
            {t.current && (
              <span className="badge success">
                <span className="dot" />
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
