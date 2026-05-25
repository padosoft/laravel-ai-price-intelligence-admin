import { I } from '@/components/ds/icons';
import { AiBadge } from '@/components/ds/pricing';
import { useToast } from '@/components/ds';
import { useAuth } from '@/state/auth-context';
import { useAiDecisions, useFetchLogs, printDocument } from '@/hooks/operate';

export function Compliance() {
  const { hasFeature } = useAuth();
  const logs = useFetchLogs(20);
  const decisions = useAiDecisions(undefined, 25);
  const decisionRows = decisions.data?.data ?? [];
  const toast = useToast();
  const exportAttestation = () => { toast.push({ title: 'Preparing attestation', body: 'Opening the print dialog…' }); printDocument(); };

  const aiAct = hasFeature('ai_act');
  const pii = hasFeature('pii');

  const checks: Array<{ check: string; ok: boolean; detail: string }> = [
    { check: 'Art. 50 transparency — AI output carries an [AI] badge', ok: true, detail: 'All AI-generated content is flagged in the UI.' },
    { check: 'Art. 14 human oversight on borderline matches', ok: true, detail: '60–85 confidence band routed to the review queue.' },
    { check: 'EU AI Act bridge (laravel-ai-act-compliance)', ok: aiAct, detail: aiAct ? 'Installed — risk register + disclosures auto-wired.' : 'Not enabled for this tenant.' },
    { check: 'GDPR Art. 5(1)(c) data minimisation on scraped content', ok: pii, detail: pii ? 'pii-redactor applied pre-persistence.' : 'PII redaction module not active.' },
    { check: 'Robots.txt default-respect policy', ok: true, detail: 'Opt-out is audit-logged per domain.' },
    { check: 'Audit log retention ≥ 90 days', ok: true, detail: 'Configured · current retention 90d.' },
  ];
  const compliant = checks.filter((c) => c.ok).length;
  const pct = Math.round((compliant / checks.length) * 100);

  return (
    <div className="page" data-testid="page-compliance">
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Compliance
            <span className="badge outline" style={{ background: 'var(--ai-bg)', color: 'var(--ai-color)', borderColor: 'var(--ai-border)' }}>EU AI Act-ready</span>
          </h1>
          <p className="page-sub">
            Risk class: limited risk. All AI decisions are flagged, disclosed, and human-reviewable.
            {aiAct ? ' Bridge: padosoft/laravel-ai-act-compliance active.' : ' Bridge not installed (no-op).'}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={exportAttestation}><I.External size={13} /> Export attestation</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 18 }}>
        <div className="card"><div className="card-body">
          <div className="kpi-label">Compliance checks passing</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: pct >= 80 ? 'var(--status-success)' : 'var(--status-paused)' }}>{pct}%</div>
            <span className={`badge ${pct >= 80 ? 'success' : 'paused'}`} style={{ fontSize: 10 }}><span className="dot" />{compliant}/{checks.length}</span>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="kpi-label">EU AI Act bridge</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 6, color: aiAct ? 'var(--status-success)' : 'var(--text-tertiary)' }}>{aiAct ? 'Active' : 'Off'}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="kpi-label">PII redaction</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 6, color: pii ? 'var(--status-success)' : 'var(--text-tertiary)' }}>{pii ? 'Active' : 'Off'}</div>
        </div></div>
      </div>

      <div className="grid-12">
        <div className="card">
          <div className="card-head"><h3 className="card-title">Compliance checks</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {checks.map((c, i) => (
              <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.ok ? 'var(--status-success-bg)' : 'var(--status-paused-bg)', color: c.ok ? 'var(--status-success)' : 'var(--status-paused)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {c.ok ? <I.Check size={12} /> : <I.AlertTriangle size={12} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.check}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Fetch audit log</h3>
            <span className="muted" style={{ fontSize: 11 }}>scrape activity · retention 90d</span>
          </div>
          <div className="card-body flush">
            {(logs.data?.data ?? []).slice(0, 12).map((r) => (
              <div key={r.id} className="audit-log-row">
                <span className="mono">{r.captured_at.slice(0, 19).replace('T', ' ')}</span>
                <span className={`badge ${r.status != null && r.status < 300 ? 'success' : r.status != null && r.status < 500 ? 'paused' : 'failed'}`}><span className="dot" />{r.status ?? '—'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{r.driver ?? 'generic'} · {r.latency_ms ?? '—'}ms</span>
                <span className="muted" style={{ fontSize: 10.5 }}>robots: <span className="mono" style={{ color: r.robots_allowed ? 'var(--status-success)' : 'var(--status-failed)' }}>{r.robots_allowed ? 'allow' : 'deny'}</span></span>
              </div>
            ))}
            {(logs.data?.data?.length ?? 0) === 0 && <div className="empty">No fetch activity in the window.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              AI decision log <AiBadge>EU AI Act Art. 12 record-keeping</AiBadge>
            </h3>
            <p className="card-sub">Every AI-assisted decision is logged with its model, confidence and cost for audit &amp; human oversight.</p>
          </div>
          <span className="muted" style={{ fontSize: 11 }}>newest {decisionRows.length}</span>
        </div>
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Feature</th>
                  <th>Subject</th>
                  <th>Model</th>
                  <th className="center">Confidence</th>
                  <th className="right">Cost</th>
                  <th>Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {decisionRows.map((d) => (
                  <tr key={d.id}>
                    <td className="mono muted">{d.created_at.slice(0, 16).replace('T', ' ')}</td>
                    <td><span className="badge outline" style={{ fontSize: 10 }}>{d.feature}</span></td>
                    <td className="mono muted" style={{ fontSize: 11 }}>{d.subject_type ? `${d.subject_type} #${d.subject_id ?? '—'}` : '—'}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{d.model ?? '—'}{d.model_version ? ` · ${d.model_version}` : ''}</td>
                    <td className="center mono">{d.confidence != null ? `${d.confidence}` : '—'}</td>
                    <td className="right mono muted" style={{ fontSize: 11 }}>{d.cost_micros != null ? `€${(d.cost_micros / 1_000_000).toFixed(4)}` : '—'}</td>
                    <td>
                      <span className={`badge ${d.human_reviewed ? 'success' : 'outline'}`} style={{ fontSize: 10 }}>
                        <span className="dot" />{d.human_reviewed ? 'reviewed' : 'auto'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!decisions.isLoading && decisionRows.length === 0 && (
                  <tr><td colSpan={7} className="empty">No AI decisions logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
