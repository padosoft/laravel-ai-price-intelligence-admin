/**
 * Pretty-print + syntax-highlight a JSON-serializable value into an HTML string.
 * Input is HTML-escaped before tokens are wrapped, so the result is safe to inject.
 * Ported from ui.jsx `jsonHighlight`.
 */
export function jsonHighlight(value: unknown): string {
  const json = JSON.stringify(value, null, 2) ?? 'null';
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (m) => {
        let cls = 'json-num';
        if (/^"/.test(m)) cls = /:$/.test(m) ? 'json-key' : 'json-string';
        else if (/true|false/.test(m)) cls = 'json-bool';
        else if (/null/.test(m)) cls = 'json-null';
        return `<span class="${cls}">${m}</span>`;
      },
    );
}
