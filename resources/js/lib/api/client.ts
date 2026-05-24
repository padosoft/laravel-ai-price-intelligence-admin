import { runtimeConfig } from '@/config';
import type { ProblemDetails } from './types';
import { mockFetch } from './mocks';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field validation errors (RFC-7807 `errors`), if any. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {};
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const base = runtimeConfig.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
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
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  if (runtimeConfig.useMocks) {
    return mockFetch<T>(method, path, opts.query, opts.body);
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const token = xsrfToken();
  if (token && method !== 'GET') headers['X-XSRF-TOKEN'] = token;

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    credentials: 'include',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

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
