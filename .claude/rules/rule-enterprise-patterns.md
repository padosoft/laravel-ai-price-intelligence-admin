# Rule: enterprise-scale + interaction patterns (B-phase, durable)

Apply these whenever touching lists, mutations, realtime, or exports. Full rationale in `AGENTS.md`
("Distilled lessons B4–B8").

## Large lists (500k SKU)
- Big tables (Catalog, Competitors) MUST be cursor-paginated (`useInfiniteQuery`) + virtualized
  (`VirtualTable` / `@tanstack/react-virtual`). `getNextPageParam` returns `undefined` (not `null`)
  at end-of-list. Filters go server-side; chip counts come from SQL facet endpoints, never a loaded
  page. A new big list needs the same treatment — don't render an unbounded `rows.map`.

## Mutations
- Wire writes through `useOptimisticCreate` (optimistic prepend + rollback + settle-invalidate);
  guard non-list sibling caches; pass `alsoInvalidate` for derived facets. Capture form values into
  locals before `mutate`. Preserve a valid `0`. No dead buttons — every action hits a real endpoint
  (backfill the core first if it's missing, per `rule-lesson-progress-logs.md`).

## Realtime
- SSE (cookie) is primary; bearer/headless or no `EventSource` → polling fallback
  (`invalidateQueries(['alerts'])`, clamped cadence). Keep the explicit transport `mode`.

## Exports
- CSV via the core's streamed `:export` (blob download); the CSV serializer must guard formula
  injection and quote CR/LF. PDF/digest with no endpoint → `window.print()` of real content (never
  synthetic data).

## Tests
- Stub `ResizeObserver` for virtualization; restore stubbed globals in `afterEach`; reset stateful
  mocks per test. Scope assertions with `within(table)` (toasts echo names/URLs).
