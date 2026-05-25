import { useMemo } from 'react';
import { I } from '@/components/ds/icons';
import { AiBadge } from '@/components/ds/pricing';
import { Gauge } from '@/components/charts';
import { useReviews } from '@/hooks/operate';

interface Theme {
  theme: string;
  pos: number;
  neg: number;
  mentions: number;
}

/** Coerce an unknown numeric field to a finite number in [min, max] (defends against bad
 * fixtures / API drift, since these drive CSS flex factors and displayed percentages). */
function clampNum(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function readThemes(raw: Array<Record<string, unknown>> | null): Theme[] {
  return (raw ?? []).map((t) => ({
    theme: String(t.theme ?? ''),
    pos: clampNum(t.pos, 0, 100),
    neg: clampNum(t.neg, 0, 100),
    mentions: Math.max(0, clampNum(t.mentions, 0, Number.MAX_SAFE_INTEGER)),
  }));
}

export function Reviews() {
  const { data, isLoading } = useReviews();
  const moduleDisabled = data?.meta?.enabled === false;
  const insights = useMemo(() => data?.data ?? [], [data]);
  const primary = insights[0] ?? null;
  const themes = readThemes(primary?.themes ?? null);

  return (
    <div className="page" data-testid="page-reviews">
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Review insights
            <AiBadge size="lg" />
            <span className="badge outline" style={{ background: 'var(--ai-bg)', color: 'var(--ai-color)', borderColor: 'var(--ai-border)' }}>
              GDPR-safe · aggregates only
            </span>
          </h1>
          <p className="page-sub">Aggregated sentiment from competitor review pages. Per-domain opt-in. No personal data stored, ever.</p>
        </div>
      </div>

      <div className="banner-soft" style={{ marginBottom: 20, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}>
        <I.Lock size={16} />
        <div style={{ flex: 1, fontSize: 12.5 }}>
          <b>Privacy contract:</b> reviews are pulled only from domains you explicitly opt in (audit-logged). Every review
          passes through <span className="mono">padosoft/laravel-pii-redactor</span> before reaching the LLM — no name,
          email, IBAN or phone number is ever persisted. Only sentiment scores and topic clusters are stored.
        </div>
      </div>

      {moduleDisabled ? (
        <div className="card"><div className="card-body empty">
          Review insight is disabled for this tenant. Enable it (and opt in per-domain) in the core
          config to start ingesting GDPR-safe aggregated sentiment.
        </div></div>
      ) : primary ? (
        <div className="grid-3">
          <div className="card">
            <div className="card-head"><h3 className="card-title">Sentiment · CP #{primary.competitor_product_id}</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
              <Gauge value={clampNum(Math.round(primary.sentiment_score * 100), 0, 100)} label="Positive sentiment" size={180} />
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
                from <span className="mono">{primary.sample_count.toLocaleString()}</span> reviews · period {primary.period}
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-head"><h3 className="card-title">Theme bars · what they talk about</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {themes.map((t) => (
                  <div key={t.theme}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ fontWeight: 500 }}>{t.theme}</span>
                      <span className="mono muted">{t.mentions} mentions</span>
                    </div>
                    <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ flex: t.pos, background: 'var(--price-pricier)', display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 9.5, color: 'white', fontFamily: 'var(--font-mono)' }}>{t.pos}%</div>
                      <div style={{ flex: Math.max(0, 100 - t.pos - t.neg), background: 'var(--bg-subtle)' }} />
                      <div style={{ flex: t.neg, background: 'var(--price-cheaper)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, fontSize: 9.5, color: 'white', fontFamily: 'var(--font-mono)' }}>{t.neg}%</div>
                    </div>
                  </div>
                ))}
                {themes.length === 0 && <div className="empty">No themes</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card"><div className="card-body empty">{isLoading ? 'Loading…' : 'Review insight module is disabled or has no data for this tenant.'}</div></div>
      )}
    </div>
  );
}
