// Formatting helpers ported from the prototype (ui.jsx). Pure, deterministic.

const RELATIVE_REF = new Date('2026-05-05T14:32:00Z').getTime();

/** Relative time vs a fixed reference (matches the prototype's demo "now"). */
export function fmtRelative(ts: number, now: number = RELATIVE_REF): string {
  const diff = (now - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function fmtTime(ts: number): string {
  return new Date(ts).toISOString().slice(11, 19) + 'Z';
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toISOString().slice(0, 19).replace('T', ' ') + 'Z';
}

export function fmtDuration(ms: number | null | undefined): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

export function fmtNum(n: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-US', opts).format(n);
}

export function fmtPct(n: number, digits = 1): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

/** Currency symbol for the common monitored currencies. */
export function currencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return currency;
  }
}
