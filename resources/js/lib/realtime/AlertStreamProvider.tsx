import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { alertStreamUrl, runtimeConfig } from '@/config';
import type { Alert, CursorPage } from '@/lib/api/types';
import { AlertStreamContext } from './alert-stream-context';

/**
 * Mounts a single Server-Sent Events subscription to the core's alert stream
 * (`GET /alerts/stream`) for the whole app, prepending incoming alerts into the cached
 * `['alerts']` pages so every open screen updates live. Wrap the app once.
 *
 * - Cookie credentials in SPA mode (EventSource can't set a Bearer header; bearer/headless
 *   deployments fall back to polling — `supported` is false there).
 * - No-ops against the dev/test mock layer so unit/e2e runs never open a real connection.
 */
export function AlertStreamProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const supported =
    !runtimeConfig.useMocks &&
    runtimeConfig.realtime.driver === 'sse' &&
    runtimeConfig.auth.mode === 'cookie' &&
    typeof EventSource !== 'undefined';
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let es: EventSource;
    try {
      es = new EventSource(alertStreamUrl(), { withCredentials: true });
    } catch {
      setConnected(false); // invalid URL / unsupported — degrade to polling
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
  }, [supported, qc]);

  return <AlertStreamContext.Provider value={{ connected, supported }}>{children}</AlertStreamContext.Provider>;
}
