import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runtimeConfig } from '@/config';
import type { Alert, CursorPage } from '@/lib/api/types';

export interface AlertStreamState {
  /** True while the SSE connection is open. */
  connected: boolean;
  /** False when there is no live transport (mock/dev or a non-SSE driver). */
  supported: boolean;
}

/**
 * Subscribes to the core's Server-Sent Events alert stream (`GET /alerts/stream`) and
 * prepends incoming alerts into the cached `['alerts']` pages so open screens update live.
 *
 * - Uses cookie credentials in SPA mode (EventSource can't set a Bearer header; bearer/headless
 *   deployments fall back to polling — `supported` is false there).
 * - No-ops against the dev/test mock layer so unit/e2e runs never open a real connection.
 */
export function useAlertStream(enabled = true): AlertStreamState {
  const qc = useQueryClient();
  const supported =
    !runtimeConfig.useMocks &&
    runtimeConfig.realtime.driver === 'sse' &&
    runtimeConfig.auth.mode === 'cookie' &&
    typeof EventSource !== 'undefined';
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !supported) return;
    const es = new EventSource(`${runtimeConfig.apiBaseUrl}/alerts/stream`, { withCredentials: true });
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false); // EventSource retries automatically
    es.onmessage = (ev: MessageEvent<string>) => {
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
        // Ignore malformed frames (e.g. keep-alive comments).
      }
    };
    return () => { es.close(); setConnected(false); };
  }, [enabled, supported, qc]);

  return { connected, supported };
}
