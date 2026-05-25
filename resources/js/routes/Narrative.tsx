import { Fragment, useState } from 'react';
import { I } from '@/components/ds/icons';
import { useAuth } from '@/state/auth-context';
import { useNarratives } from '@/hooks/operate';

/** Render inline **bold** spans within a line. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Minimal markdown → JSX for the digest subset we emit (#/##/###, - lists, **bold**, paragraphs). */
function Markdown({ md }: { md: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = md.split('\n');
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((li, i) => <li key={i}>{inline(li)}</li>)}</ul>);
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (line.startsWith('### ')) { flush(); blocks.push(<h3 key={blocks.length}>{inline(line.slice(4))}</h3>); }
    else if (line.startsWith('## ')) { flush(); blocks.push(<h2 key={blocks.length}>{inline(line.slice(3))}</h2>); }
    else if (line.startsWith('# ')) { flush(); blocks.push(<h1 key={blocks.length}>{inline(line.slice(2))}</h1>); }
    else if (line.startsWith('- ')) { list.push(line.slice(2)); }
    else { flush(); blocks.push(<p key={blocks.length}>{inline(line)}</p>); }
  }
  flush();
  return <>{blocks}</>;
}

export function Narrative() {
  const { data, isLoading } = useNarratives();
  const { me } = useAuth();
  const tenantName = me?.tenant.name ?? me?.tenant.code ?? 'Your tenant';
  const narratives = data?.data ?? [];
  const [period, setPeriod] = useState<string | null>(null);
  const current = narratives.find((n) => n.period === period) ?? narratives[0] ?? null;

  return (
    <div className="page" data-testid="page-narrative">
      <div className="page-head">
        <div>
          <h1 className="page-title">Weekly narrative</h1>
          <p className="page-sub">LLM-generated digest of last week's price intelligence. Composed every Monday 07:00 UTC.</p>
        </div>
        <div className="page-actions">
          {narratives.length > 0 && (
            <select
              className="select"
              style={{ width: 180 }}
              value={current?.period ?? ''}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Narrative period"
            >
              {narratives.map((n) => (
                <option key={n.id} value={n.period}>{n.period}</option>
              ))}
            </select>
          )}
          <button type="button" className="btn"><I.FileText size={13} /> Export PDF</button>
        </div>
      </div>

      {current ? (
        <>
          <div className="banner-soft ai" style={{ marginBottom: 24 }}>
            <I.Sparkle size={16} />
            <div style={{ flex: 1, fontSize: 12.5 }}>
              <b>AI-generated content disclosure</b> · generated {current.generated_at.slice(0, 16).replace('T', ' ')} UTC from
              aggregated observations (no PII). You are reading machine-written text — per EU AI Act Art. 50 it is flagged
              AI-generated and logged for audit.
            </div>
          </div>
          <article className="narrative-doc">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', marginBottom: 6 }}>
              {current.period} · {tenantName.toUpperCase()}
            </div>
            <Markdown md={current.summary_md} />
          </article>
        </>
      ) : (
        <div className="card"><div className="card-body empty">{isLoading ? 'Loading…' : 'No narrative generated yet.'}</div></div>
      )}
    </div>
  );
}
