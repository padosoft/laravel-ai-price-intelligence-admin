import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { I } from '@/components/ds/icons';
import { currencySymbol } from '@/lib/format';
import { isFeatureVisible } from './nav';
import type { PaletteCompetitor, PaletteProduct, RouteKey, TenantFeatures } from '@/lib/types';

interface PaletteItem {
  label: string;
  hint?: string;
  icon: ReactNode;
  action: () => void;
  meta?: string;
}

interface PaletteSection {
  section: string;
  items: PaletteItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: RouteKey) => void;
  onOpenCompetitor: (id: string) => void;
  products?: PaletteProduct[];
  competitors?: PaletteCompetitor[];
  features?: TenantFeatures;
}

interface NavTarget {
  label: string;
  hint: string;
  icon: keyof typeof I;
  route: RouteKey;
  feature?: keyof TenantFeatures;
}

const NAV_TARGETS: NavTarget[] = [
  { label: 'Dashboard', hint: 'home', icon: 'Home', route: 'dashboard' },
  { label: 'Matches review', hint: 'review queue', icon: 'Compare', route: 'matches' },
  { label: 'Prices explorer', hint: 'charts', icon: 'Tag', route: 'prices' },
  { label: 'Anomalies', hint: 'intelligence', icon: 'Anomaly', route: 'anomalies' },
  { label: 'Forecasts', hint: 'intelligence', icon: 'TrendUp', route: 'forecasts' },
  { label: 'Weekly narrative', hint: 'AI digest', icon: 'FileText', route: 'narrative' },
  { label: 'Assortment gaps', hint: 'treemap', icon: 'Layers', route: 'assortment' },
  { label: 'Repricer rules', hint: 'pricing', icon: 'Wrench', route: 'repricer', feature: 'repricer' },
  { label: 'Alerts inbox', hint: 'system', icon: 'Bell', route: 'alerts' },
  { label: 'Webhooks', hint: 'system', icon: 'Webhook', route: 'webhooks' },
  { label: 'API keys', hint: 'system', icon: 'Key', route: 'api_keys' },
  { label: 'Compliance & AI log', hint: 'EU AI Act', icon: 'Shield', route: 'compliance', feature: 'ai_act' },
  { label: 'Settings', hint: 'system', icon: 'Settings', route: 'settings' },
];

/** ⌘K command palette: jump to a route, product, or competitor listing (ported from shell.jsx). */
export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenCompetitor,
  products = [],
  competitors = [],
  features,
}: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const navItems = useMemo<PaletteItem[]>(
    () =>
      NAV_TARGETS.filter((n) => isFeatureVisible(features, n.feature)).map((n) => {
        const IconCmp = I[n.icon];
        return {
          label: n.label,
          hint: n.hint,
          icon: <IconCmp size={14} />,
          action: () => onNavigate(n.route),
        };
      }),
    [onNavigate, features],
  );

  const productItems = useMemo<PaletteItem[]>(
    () =>
      products.map((p) => ({
        label: p.name,
        hint: p.sku,
        icon: <I.Box size={14} />,
        action: () => onNavigate('catalog'),
        meta: `${currencySymbol('EUR')}${(p.ourCents / 100).toFixed(2)}`,
      })),
    [products, onNavigate],
  );

  const compItems = useMemo<PaletteItem[]>(
    () =>
      competitors.map((c) => ({
        label: `${c.host} · ${c.label}`,
        hint: c.id,
        icon: <I.Store size={14} />,
        action: () => onOpenCompetitor(c.id),
        meta: `${currencySymbol('EUR')}${(c.priceCents / 100).toFixed(2)}`,
      })),
    [competitors, onOpenCompetitor],
  );

  const results = useMemo<PaletteSection[]>(() => {
    const ql = q.toLowerCase().trim();
    if (!ql) {
      const sections: PaletteSection[] = [{ section: 'Navigate', items: navItems.slice(0, 8) }];
      if (productItems.length) sections.push({ section: 'Products', items: productItems.slice(0, 4) });
      return sections;
    }
    const match = (i: PaletteItem) =>
      i.label.toLowerCase().includes(ql) || (i.hint?.toLowerCase().includes(ql) ?? false);
    const sections: PaletteSection[] = [];
    const navMatch = navItems.filter(match);
    const prodMatch = productItems.filter(match).slice(0, 6);
    const compMatch = compItems.filter((i) => i.label.toLowerCase().includes(ql)).slice(0, 6);
    if (navMatch.length) sections.push({ section: 'Navigate', items: navMatch });
    if (prodMatch.length) sections.push({ section: 'Products', items: prodMatch });
    if (compMatch.length) sections.push({ section: 'Competitor listings', items: compMatch });
    return sections;
  }, [q, navItems, productItems, compItems]);

  const flat = useMemo(() => results.flatMap((s) => s.items), [results]);
  const indexOf = useMemo(() => new Map(flat.map((it, i) => [it, i] as const)), [flat]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.max(0, Math.min(flat.length - 1, a + 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = flat[active];
        if (it) {
          it.action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, active, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          id={`${listId}-input`}
          role="combobox"
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={flat.length > 0 ? `${listId}-item-${active}` : undefined}
          className="palette-input"
          placeholder="Search products, competitors, hosts, or jump to a page…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
        />
        <div id={listId} role="listbox" className="palette-list">
          {results.length === 0 && (
            <div className="empty" style={{ padding: '32px 16px' }}>
              No results
            </div>
          )}
          {results.map((sec) => (
            <div key={sec.section}>
              <div className="palette-section">{sec.section}</div>
              {sec.items.map((it) => {
                const idx = indexOf.get(it) ?? 0;
                return (
                  <button
                    key={`${sec.section}-${idx}`}
                    id={`${listId}-item-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    className={`palette-item ${idx === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      it.action();
                      onClose();
                    }}
                  >
                    <span className="icon">{it.icon}</span>
                    <span>{it.label}</span>
                    {it.meta && <span className="meta">{it.meta}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <span className="kbd">↑↓</span> Navigate
          </span>
          <span>
            <span className="kbd">↵</span> Open
          </span>
          <span>
            <span className="kbd">esc</span> Close
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <span className="kbd">⌘K</span> toggles
          </span>
        </div>
      </div>
    </>
  );
}
