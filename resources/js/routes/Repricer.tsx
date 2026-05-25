import { useMemo, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Price, PriceDelta, AiBadge, Tag } from '@/components/ds/pricing';
import { Modal, useToast } from '@/components/ds';
import { useRules, useRuleActions, useRuleDecisions } from '@/hooks/operate';
import type { RepricingRule, RuleStrategy, SimulateDecision } from '@/lib/api/types';

function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

const STRATEGIES: RuleStrategy[] = ['match_cheapest', 'beat_top_n', 'undercut_pct', 'match_with_floor', 'dynamic_demand', 'custom'];

export function Repricer() {
  const { data } = useRules();
  const rules = useMemo(() => data?.data ?? [], [data]);
  const decisions = useRuleDecisions();
  const { create, setStatus, remove, simulate } = useRuleActions();
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = rules.find((r) => r.id === selectedId) ?? rules[0] ?? null;
  const [simRows, setSimRows] = useState<SimulateDecision[] | null>(null);

  const [open, setOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [strategy, setStrategy] = useState<RuleStrategy>('undercut_pct');
  const [priority, setPriority] = useState('100');

  const submitRule = () => {
    if (ruleName.trim() === '') return;
    create.mutate(
      { name: ruleName.trim(), strategy, priority: Number(priority) || 100 },
      {
        onSuccess: () => { toast.push({ title: 'Rule created', body: ruleName.trim() }); setOpen(false); setRuleName(''); setStrategy('undercut_pct'); setPriority('100'); },
        onError: () => toast.push({ title: 'Could not create rule', kind: 'error' }),
      },
    );
  };

  const runSimulate = (rule: RepricingRule) => {
    // Dry-run with a couple of representative SKUs; the core returns decisions without persisting.
    const samples = [
      { product_id: 1, current_price_cents: 79900, competitor_prices_cents: [76900, 78900] },
      { product_id: 3, current_price_cents: 129900, competitor_prices_cents: [124900, 126900] },
    ];
    simulate.mutate(
      { id: rule.id, samples },
      {
        onSuccess: (res) => { setSimRows(res.decisions); toast.push({ title: 'Simulation complete', body: `${res.decisions.length} decision(s) · no webhooks dispatched` }); },
        onError: () => toast.push({ title: 'Simulation failed', kind: 'error' }),
      },
    );
  };

  const filter = (selected?.target_filter ?? {}) as Record<string, unknown>;
  const params = (selected?.parameters ?? {}) as Record<string, unknown>;

  return (
    <div className="page" data-testid="page-repricer">
      <div className="page-head">
        <div>
          <h1 className="page-title">Repricer rules</h1>
          <p className="page-sub">
            Emits <span className="mono">repricing.suggested</span> webhooks — never applies prices automatically. Your host (MarginOS) decides.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn primary" onClick={() => setOpen(true)}><I.Plus size={13} /> New rule</button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New repricing rule"
        sub="Advisory-only: the rule emits repricing.suggested webhooks; it never applies prices. Tune the target filter and parameters after creation."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={ruleName.trim() === '' || create.isPending} onClick={submitRule}>
              {create.isPending ? 'Creating…' : 'Create rule'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <label htmlFor="rule-name">Name</label>
          <input id="rule-name" className="input" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Beat Amazon by 2%" />
        </div>
        <div className="form-row">
          <label htmlFor="rule-strategy">Strategy</label>
          <select id="rule-strategy" className="select" value={strategy} onChange={(e) => setStrategy(e.target.value as RuleStrategy)}>
            {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="rule-priority">Priority</label>
          <input id="rule-priority" className="input" type="number" min={0} max={65535} value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
      </Modal>

      <div className="banner-soft" style={{ marginBottom: 18 }}>
        <I.Lock size={16} style={{ color: 'var(--text-secondary)' }} />
        <div style={{ flex: 1, fontSize: 12.5 }}>
          <b>Advisory-only mode active</b> · this engine emits suggestions only; the host receives a webhook and decides whether to apply.
        </div>
      </div>

      <div className="grid-21">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Rules</h3>
            <span className="muted">{rules.filter((r) => r.status === 'active').length} of {rules.length} active</span>
          </div>
          <div className="card-body flush">
            {rules.map((r) => {
              const isSel = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className="cell-open-btn"
                  aria-current={isSel ? 'true' : undefined}
                  onClick={() => { setSelectedId(r.id); setSimRows(null); }}
                  style={{ display: 'block', width: '100%', padding: '14px', borderBottom: '1px solid var(--border)', background: isSel ? 'var(--bg-active)' : 'transparent', borderLeft: isSel ? '2px solid var(--text)' : '2px solid transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>P{r.priority}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${r.status === 'active' ? 'success' : 'paused'}`} style={{ fontSize: 10 }}><span className="dot" />{r.status}</span>
                    <span className="badge outline" style={{ fontSize: 10 }}>{r.strategy}</span>
                  </div>
                </button>
              );
            })}
            {rules.length === 0 && <div className="empty">No rules</div>}
          </div>
        </div>

        <div className="card">
          {selected ? (
            <>
              <div className="card-head">
                <div>
                  <h3 className="card-title">{selected.name}</h3>
                  <p className="card-sub">Strategy: <span className="mono">{selected.strategy}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate(
                      { id: selected.id, status: selected.status === 'active' ? 'paused' : 'active' },
                      { onSuccess: () => toast.push({ title: selected.status === 'active' ? 'Rule paused' : 'Rule activated' }), onError: () => toast.push({ title: 'Update failed', kind: 'error' }) },
                    )}
                  >
                    {selected.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button type="button" className="btn sm" onClick={() => runSimulate(selected)} disabled={simulate.isPending}>
                    <I.Sparkle size={11} /> Simulate
                  </button>
                  <button
                    type="button"
                    className="btn sm danger"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(selected.id, { onSuccess: () => { setSelectedId(null); toast.push({ title: 'Rule deleted' }); }, onError: () => toast.push({ title: 'Delete failed', kind: 'error' }) })}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div>
                  <div className="kpi-label" style={{ marginBottom: 12 }}>Target filter</div>
                  <div className="form-row">
                    <span className="group-label">Categories</span>
                    <div className="tag-list">{asStringList(filter.categories).map((c) => <Tag key={c}>{c}</Tag>)}</div>
                  </div>
                  <div className="form-row">
                    <span className="group-label">Countries</span>
                    <div className="tag-list">{asStringList(filter.countries).map((c) => <Tag key={c}>{c}</Tag>)}</div>
                  </div>
                </div>
                <div>
                  <div className="kpi-label" style={{ marginBottom: 12 }}>Parameters</div>
                  {Object.entries(params).map(([k, v]) => (
                    <div key={k} className="form-row" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <span className="group-label">{k}</span>
                      <span className="mono" style={{ fontSize: 12 }}>{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {simRows && (
                <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Dry-run preview <AiBadge>no webhooks dispatched</AiBadge>
                  </h4>
                  <table className="tbl">
                    <thead><tr><th>Product</th><th className="right">Current</th><th className="right">Suggested</th><th className="right">Δ</th><th>Changed</th></tr></thead>
                    <tbody>
                      {simRows.map((d, i) => {
                        const pct = d.current_price_cents != null && d.suggested_price_cents != null && d.current_price_cents !== 0 ? ((d.suggested_price_cents - d.current_price_cents) / d.current_price_cents) * 100 : null;
                        return (
                          <tr key={i}>
                            <td className="mono">#{d.product_id ?? '—'}</td>
                            <td className="right">{d.current_price_cents != null ? <Price cents={d.current_price_cents} /> : '—'}</td>
                            <td className="right" style={{ color: 'var(--ai-color)', fontWeight: 500 }}>{d.suggested_price_cents != null ? <Price cents={d.suggested_price_cents} /> : '—'}</td>
                            <td className="right">{pct != null ? <PriceDelta pct={pct} /> : '—'}</td>
                            <td><span className={`badge ${d.changed ? 'success' : 'pending'}`}><span className="dot" />{d.changed ? 'yes' : 'no'}</span></td>
                          </tr>
                        );
                      })}
                      {simRows.length === 0 && <tr><td colSpan={5} className="empty">No price changes suggested for the sampled SKUs.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card-body empty">No repricing rules yet.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h3 className="card-title">Recent decisions</h3>
          <span className="muted">advisory log · never applied automatically</span>
        </div>
        <div className="card-body flush">
          <table className="tbl">
            <thead><tr><th>Rule</th><th className="mono">Product</th><th className="right">Current</th><th className="right">Suggested</th><th>Applied</th><th>Reason</th></tr></thead>
            <tbody>
              {(decisions.data?.data ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="mono muted">#{d.repricing_rule_id}</td>
                  <td className="mono">#{d.product_id}</td>
                  <td className="right">{d.current_price_cents != null ? <Price cents={d.current_price_cents} /> : '—'}</td>
                  <td className="right">{d.suggested_price_cents != null ? <Price cents={d.suggested_price_cents} /> : '—'}</td>
                  <td><span className={`badge ${d.applied ? 'success' : 'outline'}`}>{d.applied ? 'applied' : 'advisory'}</span></td>
                  <td className="muted" style={{ fontSize: 11 }}>{d.reason ?? '—'}</td>
                </tr>
              ))}
              {(decisions.data?.data?.length ?? 0) === 0 && <tr><td colSpan={6} className="empty">No decisions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
