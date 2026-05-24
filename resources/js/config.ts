// Runtime configuration injected by the Blade wrapper (see app.blade.php). In dev
// and tests a fallback is provided by index.html / the test setup.
export interface AdminRuntimeConfig {
  apiBaseUrl: string;
  auth: { mode: 'cookie' | 'bearer' };
  locale: string;
  csrfCookie: string;
  realtime: { driver: 'sse' | 'echo' };
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
  locale: 'it',
  csrfCookie: 'XSRF-TOKEN',
  realtime: { driver: 'sse' },
  useMocks: true,
};

export const runtimeConfig: AdminRuntimeConfig = window.__PI_ADMIN__ ?? fallback;
