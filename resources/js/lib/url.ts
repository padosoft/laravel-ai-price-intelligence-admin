/**
 * Returns the URL only if it is a safe http(s) link, else undefined. Competitor URLs come
 * from scraped/external data, so they must never be placed in an href unchecked — a
 * `javascript:`/`data:` scheme would otherwise execute on click (XSS).
 */
export function safeHttpUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw, window.location.origin);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}
