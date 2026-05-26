import { useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualTableProps<T> {
  rows: T[];
  /** Returns a full `<tr key=…>…</tr>` for the row. */
  renderRow: (row: T, index: number) => ReactNode;
  /** The `<tr>` cells for the `<thead>`. */
  head: ReactNode;
  /** Column count, for the spacer rows' colSpan. */
  colCount: number;
  estimateRowHeight?: number;
  maxHeight?: number | string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** A `<tr>` shown when there are no rows. */
  empty?: ReactNode;
  testId?: string;
  /** Accessible label for the scroll region (keyboard users focus it to scroll). */
  ariaLabel?: string;
}

/**
 * Virtualized, optionally-infinite table built on @tanstack/react-virtual. Renders only the
 * visible window of `<tr>`s inside a scroll container, padding the top/bottom with spacer rows so
 * `<table>`/`<tr>` semantics (and the DS `.tbl` styling) are preserved — this keeps thousands of
 * rows smooth at 500k-SKU scale. When the user scrolls near the end and `hasNextPage`, it calls
 * `onLoadMore` to fetch the next cursor page.
 */
export function VirtualTable<T>({
  rows,
  renderRow,
  head,
  colCount,
  estimateRowHeight = 56,
  maxHeight = '68vh',
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  empty,
  testId,
  ariaLabel,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const padTop = items.length > 0 ? items[0].start : 0;
  const padBottom = items.length > 0 ? totalSize - items[items.length - 1].end : 0;
  // -1 when no window is measured, so the prefetch effect never fires off a non-scroll render.
  const lastIndex = items.length > 0 ? items[items.length - 1].index : -1;
  // When the scroll viewport isn't measurable (jsdom/SSR — no layout), the virtualizer yields no
  // window; render all rows so content is never lost. Real browsers always measure a viewport.
  const virtualized = items.length > 0;

  // Prefetch the next page once the last *rendered* (virtual) row is in/near view. Gated on a
  // real virtual window so it's driven by scroll position, not an unmeasured render.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && items.length > 0 && lastIndex >= rows.length - 1) {
      onLoadMore?.();
    }
  }, [lastIndex, items.length, hasNextPage, isFetchingNextPage, rows.length, onLoadMore]);

  return (
    <div
      ref={parentRef}
      className="table-wrap"
      style={{ maxHeight, overflow: 'auto' }}
      data-testid={testId}
      // Focusable so keyboard-only users can scroll the virtualized body (PageDown/Arrows).
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
    >
      <table className="tbl">
        <thead>{head}</thead>
        <tbody>
          {virtualized ? (
            <>
              {padTop > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={colCount} style={{ height: padTop, padding: 0, border: 0 }} />
                </tr>
              )}
              {items.map((vi) => renderRow(rows[vi.index], vi.index))}
              {padBottom > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={colCount} style={{ height: padBottom, padding: 0, border: 0 }} />
                </tr>
              )}
            </>
          ) : (
            rows.map((row, i) => renderRow(row, i))
          )}
          {rows.length === 0 && empty}
        </tbody>
      </table>
      {isFetchingNextPage && (
        <div className="muted" style={{ padding: 10, textAlign: 'center', fontSize: 12 }}>Loading more…</div>
      )}
    </div>
  );
}
