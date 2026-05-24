import type { CSSProperties } from 'react';
import type { TreemapItem } from './helpers';

export interface TreemapProps {
  items: TreemapItem[];
  width?: number;
  height?: number;
  focusedId?: string | null;
  onSelect?: (id: string) => void;
}

interface Cell extends TreemapItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Slice-and-dice treemap for assortment gaps; a focused cell expands to fill the stage. */
export function Treemap({ items, width = 700, height = 360, focusedId, onSelect }: TreemapProps) {
  const cells: Cell[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let horizontal = w > h;
  // Track the remaining sum incrementally so the layout is O(n), not O(n²).
  let remainingTotal = items.reduce((s, r) => s + r.value, 0);

  items.forEach((it, idx) => {
    const left = items.length - idx;
    // Even split when the remaining values sum to 0 (avoids divide-by-zero -> Infinity).
    const frac = remainingTotal > 0 ? it.value / remainingTotal : 1 / left;
    if (horizontal) {
      const cellW = w * frac;
      cells.push({ ...it, x, y, w: cellW, h });
      x += cellW;
      w -= cellW;
    } else {
      const cellH = h * frac;
      cells.push({ ...it, x, y, w, h: cellH });
      y += cellH;
      h -= cellH;
    }
    remainingTotal -= it.value;
    horizontal = w > h;
  });

  return (
    <div className="treemap-stage" style={{ width, height }}>
      {cells.map((c) => {
        const intensity = (c.score ?? 50) / 100;
        const bg = `color-mix(in oklab, var(--price-cheaper) ${10 + intensity * 35}%, var(--bg-elevated))`;
        const id = c.id ?? c.label;
        const isFocused = focusedId === id;
        const isDim = Boolean(focusedId) && !isFocused;
        const style: CSSProperties = isFocused
          ? { left: 0, top: 0, width, height, background: bg, zIndex: 5 }
          : { left: c.x, top: c.y, width: c.w, height: c.h, background: bg };
        return (
          <button
            key={id}
            type="button"
            className={`treemap-cell ${isFocused ? 'focused' : ''} ${isDim ? 'dim' : ''}`}
            style={style}
            onClick={() => onSelect?.(id)}
            title={`${c.label} · ${c.value} gaps · score ${c.score}`}
          >
            <div>
              <h4 style={isFocused ? { fontSize: 22 } : undefined}>{c.label}</h4>
              <small>score {c.score}</small>
            </div>
            <div>
              <div className="num" style={isFocused ? { fontSize: 36 } : undefined}>
                {c.value}
              </div>
              <small>gaps</small>
            </div>
          </button>
        );
      })}
    </div>
  );
}
