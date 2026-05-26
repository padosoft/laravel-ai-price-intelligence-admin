// Runtime configuration injected by the Blade wrapper (see app.blade.php). In dev
// and tests a fallback is provided by index.html / the test setup.
export interface AdminRuntimeConfig {
  apiBaseUrl: string;
  auth: { mode: 'cookie' | 'bearer' };
  locale: string;
  csrfCookie: string;
  /** `driver`: live-alert transport. `pollIntervalMs`: refetch cadence (ms) for the polling
   * fallback used when SSE isn't available (bearer/headless or no EventSource). */
  realtime: { driver: 'sse' | 'echo'; pollIntervalMs?: number };
  useMocks?: boolean;
}

declare global {
  interface Window {
    __PI_ADMIN__?: AdminRuntimeConfig;
  }
}

const fallback: AdminRuntimeConfig = {
  apiBaseUrl: '/api/v1',
  auth: { mode: 'cookie' },
  // Dev/demo default; the host injects the tenant's locale via window.__PI_ADMIN__.
  // English-first here so the standalone demo matches the prototype copy.
  locale: 'en',
  csrfCookie: 'XSRF-TOKEN',
  realtime: { driver: 'sse' },
  useMocks: true,
};

export const runtimeConfig: AdminRuntimeConfig = window.__PI_ADMIN__ ?? fallback;

/** API base with any trailing slash removed, so `${apiBase}/path` never double-slashes. */
export const apiBase = runtimeConfig.apiBaseUrl.replace(/\/+$/, '');

/** Absolute URL of the SSE alert stream (single source of truth for the realtime layer). */
export function alertStreamUrl(): string {
  return `${apiBase}/alerts/stream`;
}
