// Minimal RFC-4180-ish CSV serializer shared by the export flows (client-side exports and the
// mock `:export` synthesizer). Quotes fields containing commas, quotes, or newlines.

export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(v: CsvCell): string {
  const s = v == null ? '' : String(v);
  // Quote fields containing a comma, quote, or any newline char (LF, CR, or CRLF).
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a header row + data rows into a CSV string (LF-joined). */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}
