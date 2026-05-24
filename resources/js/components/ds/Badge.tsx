const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  success: 'Succeeded',
  failed: 'Failed',
  paused: 'Paused',
  pending: 'Pending',
  compensated: 'Compensated',
  delivered: 'Delivered',
  dead: 'Dead-letter',
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
}

/** Status pill with a leading dot, ported from the prototype `.badge` classes. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}
