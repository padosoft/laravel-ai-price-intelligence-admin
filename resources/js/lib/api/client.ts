import { apiBase, runtimeConfig } from '@/config';
import type { ProblemDetails } from './types';
import { mockDownload, mockFetch } from './mocks';
import { getBearerToken } from './token';

// Re-exported from its own module so the mock layer can throw it without a circular import.
export { ApiError } from './errors';
import { ApiError } from './errors';

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== null && v !== undefined && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Read the XSRF cookie Sanctum sets, for the X-XSRF-TOKEN header on mutations. */
function xsrfToken(): string | null {
  const name = runtimeConfig.csrfCookie;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  if (runtimeConfig.useMocks) {
    return mockFetch<T>(method, path, opts.query, opts.body);
  }

  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  // Let the browser set multipart boundaries for FormData; only JSON bodies are stringified.
  if (opts.body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const bearer = runtimeConfig.auth.mode === 'bearer';
  if (bearer) {
    // Headless / cross-domain: authenticate with a Sanctum personal token.
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else {
    // Cookie SPA (Sanctum): send the XSRF token on mutating requests.
    const token = xsrfToken();
    if (token && method !== 'GET') headers['X-XSRF-TOKEN'] = token;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    // Cookies only matter in SPA mode; bearer mode is stateless.
    credentials: bearer ? 'omit' : 'include',
    headers,
    body: opts.body === undefined ? undefined : isFormData ? (opts.body as FormData) : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(res.status, null, `HTTP ${res.status}: non-JSON response`);
  }

  if (!res.ok) {
    const problem = (json ?? null) as ProblemDetails | null;
    throw new ApiError(res.status, problem, problem?.detail ?? problem?.title ?? `HTTP ${res.status}`);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Unwrap a `{ data: T }` single-resource envelope. */
export function unwrap<T>(res: { data: T }): T {
  return res.data;
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
}

/** Parse the download filename out of a Content-Disposition header, if present. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (star) {
    const raw = star[1].replace(/^"|"$/g, '');
    // Malformed percent-encoding would make decodeURIComponent throw; fall back to the raw value.
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : null;
}

/**
 * Fetch a binary/streamed download (the core's `:export` CSV endpoints) as a Blob, applying
 * the same auth as `request`. In mock mode it resolves a synthesized CSV so the dev SPA and
 * tests work without a backend. Returns the blob + resolved filename without touching the DOM
 * (the caller decides when/how to save), so it stays unit-testable.
 */
export async function fetchBlob(path: string, query: Query | undefined, fallbackName: string): Promise<DownloadResult> {
  if (runtimeConfig.useMocks) {
    const { text, filename } = mockDownload(path, query);
    return { blob: new Blob([text], { type: 'text/csv' }), filename: filename || fallbackName };
  }

  const headers: Record<string, string> = {};
  const bearer = runtimeConfig.auth.mode === 'bearer';
  if (bearer) {
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method: 'GET',
    credentials: bearer ? 'omit' : 'include',
    headers,
  });
  if (!res.ok) throw new ApiError(res.status, null, `HTTP ${res.status}: export failed`);
  const blob = await res.blob();
  return { blob, filename: filenameFromDisposition(res.headers.get('Content-Disposition')) ?? fallbackName };
}

/** Trigger a browser "Save as" for a blob. No-op where the DOM/URL APIs are unavailable (jsdom). */
export function saveBlob(blob: Blob, filename: string): void {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Fetch a `:export` endpoint and save it to the user's downloads. */
export async function downloadCsv(path: string, query: Query | undefined, fallbackName: string): Promise<void> {
  const { blob, filename } = await fetchBlob(path, query, fallbackName);
  saveBlob(blob, filename);
}
