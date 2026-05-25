// Minimal RFC-4180-ish CSV serializer shared by the export flows (client-side exports and the
// mock `:export` synthesizer). Quotes fields containing commas, quotes, or newlines.

export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(v: CsvCell): string {
  let s = v == null ? '' : String(v);
  // CSV formula-injection guard: a cell that (after any leading whitespace, which spreadsheets
  // trim) starts with = + - @ — or starts with a tab/CR — can be executed as a formula by
  // Excel/Sheets. Exports include scrape-/user-derived titles & URLs, so neutralize it by
  // prefixing a single quote before the usual quoting.
  if (/^\s*[=+\-@]/.test(s) || /^[\t\r]/.test(s)) s = `'${s}`;
  // Quote fields containing a comma, quote, or any newline char (LF, CR, or CRLF).
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a header row + data rows into a CSV string (LF-joined). */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}
