import type { CSSProperties, ReactNode } from 'react';

/** Keyboard key hint pill. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        padding: '1px 5px',
        border: '1px solid var(--border)',
        borderRadius: 3,
        background: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  );
}

export interface SkeletonProps {
  w?: number | string;
  h?: number | string;
  style?: CSSProperties;
}

/** Loading placeholder block. */
export function Skeleton({ w = '100%', h = 14, style }: SkeletonProps) {
  return (
    <div
      style={{ width: w, height: h, background: 'var(--bg-subtle)', borderRadius: 4, ...style }}
      aria-hidden="true"
    />
  );
}
