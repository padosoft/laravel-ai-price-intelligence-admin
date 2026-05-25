import type { ProblemDetails } from './types';

/**
 * Transport error carrying the HTTP status, so the QueryClient retry policy can skip 4xx
 * (auth/validation/not-found) and only retry transient 5xx. Lives in its own module so both
 * the real client and the dev mock layer can throw it without a circular import.
 */
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
