import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { alertStreamUrl, runtimeConfig } from '@/config';
import type { Alert, CursorPage } from '@/lib/api/types';
import { AlertStreamContext } from './alert-stream-context';

/** Default polling cadence (ms) when the SSE fallback is active. */
const DEFAULT_POLL_INTERVAL_MS = 15_000;
/** Floor for the poll interval, so a misconfigured value can't tight-loop the backend. */
const MIN_POLL_INTERVAL_MS = 1_000;

/** Resolve a safe poll cadence: the configured value when it's a positive finite number, else the
 * default, clamped to a sane minimum. */
function resolvePollIntervalMs(configured: number | undefined): number {
  const value = typeof configured === 'number' && Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_POLL_INTERVAL_MS;
  return Math.max(value, MIN_POLL_INTERVAL_MS);
}

/**
 * Mounts the app's single live-alert transport and keeps the cached `['alerts']` pages fresh so
 * every open screen updates live. Wrap the app once.
 *
 * - **SSE (primary)** in cookie SPA mode: subscribes to `GET /alerts/stream` (EventSource with
 *   cookie credentials) and prepends incoming alerts into the cache. `mode: 'sse'`.
 * - **Polling fallback** when SSE can't be used — bearer/headless auth (EventSource can't send a
 *   Bearer header), a non-SSE driver, or no `EventSource` — invalidates `['alerts']` on an
 *   interval so "live" degrades gracefully. `mode: 'polling'`.
 * - **Off** against the dev/test mock layer (never opens a connection or timer). `mode: 'off'`.
 */
export function AlertStreamProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const sseSupported =
    !runtimeConfig.useMocks &&
    runtimeConfig.realtime.driver === 'sse' &&
    runtimeConfig.auth.mode === 'cookie' &&
    typeof EventSource !== 'undefined';
  // Real backend but SSE isn't usable (bearer/headless, non-SSE driver, or no EventSource) → poll.
  const pollingFallback = !runtimeConfig.useMocks && !sseSupported;
  const mode: 'sse' | 'polling' | 'off' = sseSupported ? 'sse' : pollingFallback ? 'polling' : 'off';

  const [connected, setConnected] = useState(false);

  // SSE transport (primary).
  useEffect(() => {
    if (mode !== 'sse') return;
    let es: EventSource;
    try {
      es = new EventSource(alertStreamUrl(), { withCredentials: true });
    } catch {
      setConnected(false); // invalid URL / unsupported
      return;
    }
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false); // EventSource retries automatically
    // The core dispatches named SSE events (`event: alert` for payloads, `event: heartbeat`
    // for keep-alives), so listen for 'alert' specifically — the default onmessage handler
    // would never fire for named events.
    const onAlert = (ev: MessageEvent<string>) => {
      try {
        const alert = JSON.parse(ev.data) as Alert;
        qc.setQueriesData<CursorPage<Alert>>({ queryKey: ['alerts'] }, (prev) => {
          if (!prev) return prev;
          // Prepend (deduped) and cap to the page size so the cached first page stays bounded
          // — full history remains reachable via cursor pagination.
          const cap = prev.per_page > 0 ? prev.per_page : 100;
          return { ...prev, data: [alert, ...prev.data.filter((a) => a.id !== alert.id)].slice(0, cap) };
        });
      } catch {
        // Ignore malformed frames.
      }
    };
    es.addEventListener('alert', onAlert as EventListener);
    return () => { es.removeEventListener('alert', onAlert as EventListener); es.close(); setConnected(false); };
  }, [mode, qc]);

  // Polling fallback: periodically re-fetch the alerts queries so the inbox stays near-live where
  // SSE isn't available. Cookie-mode SSE remains primary and never polls.
  useEffect(() => {
    if (mode !== 'polling') return;
    const interval = resolvePollIntervalMs(runtimeConfig.realtime.pollIntervalMs);
    setConnected(true);
    const id = setInterval(() => { void qc.invalidateQueries({ queryKey: ['alerts'] }); }, interval);
    return () => { clearInterval(id); setConnected(false); };
  }, [mode, qc]);

  return (
    <AlertStreamContext.Provider value={{ connected, supported: mode !== 'off', mode }}>
      {children}
    </AlertStreamContext.Provider>
  );
}
