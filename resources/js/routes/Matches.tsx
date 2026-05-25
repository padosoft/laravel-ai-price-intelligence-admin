import { useCallback, useEffect, useRef, useState } from 'react';
import { I } from '@/components/ds/icons';
import { Kbd } from '@/components/ds';
import { Price, PriceDelta, AiBadge, ConfidenceBadge, HostChip } from '@/components/ds/pricing';
import { ProductImg } from '@/components/screens/shared';
import { useToast } from '@/components/ds';
import { useMatches, useMatchActions } from '@/hooks/operate';
import { safeHttpUrl } from '@/lib/url';
import type { MatchEvidence, MatchProposal } from '@/lib/api/types';

type Decision = 'approve' | 'reject';
interface HistoryItem { id: number; action: Decision; fresh: boolean; proposal: MatchProposal }

function evidenceStatus(e: MatchEvidence): 'match' | 'nomatch' | 'skip' {
  if (e.matched === null) return 'skip';
  return e.matched ? 'match' : 'nomatch';
}

export function Matches() {
  const { data, isLoading } = useMatches('pending');
  const { approve, reject } = useMatchActions();
  const toast = useToast();

  // Local queue: seeded once from the first successful fetch. We never re-sync from
  // the server so that the server removing a processed item from the pending list
  // doesn't shift the array under an advancing idx (queue-skip bug).
  const [localQueue, setLocalQueue] = useState<MatchProposal[]>([]);
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && data !== undefined) {
      setLocalQueue(data.data ?? []);
      seeded.current = true;
    }
  }, [data]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [flying, setFlying] = useState<Decision | null>(null);
  const [animKey, setAnimKey] = useState(0);

  // Track pending animation timers so they can be cancelled on unmount (avoids a
  // state update after the screen is navigated away mid-swipe).
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== t);
      fn();
    }, ms);
    timers.current.push(t);
  }, []);

  const decide = useCallback(
    (action: Decision) => {
      if (flying) return;
      const current = localQueue[0];
      if (!current) return;
      setFlying(action);
      setHistory((h) => [...h, { id: current.id, action, fresh: true, proposal: current }]);
      // Clear the pulse only for this entry, so a rapid follow-up decision doesn't
      // prematurely stop the previous pip's animation.
      schedule(() => setHistory((h) => h.map((x) => (x.id === current.id ? { ...x, fresh: false } : x))), 600);
      const mutation = action === 'approve' ? approve : reject;
      // Optimistic: the card flies out immediately for a snappy queue, but the success
      // toast is only shown once the server confirms; a failure rolls the card back into
      // the queue and drops its history entry so the user never sees a false "approved".
      mutation.mutate(current.id, {
        onSuccess: () =>
          toast.push({
            title: action === 'approve' ? 'Match approved' : 'Match rejected',
            body: `#${current.id} · confidence ${current.confidence}`,
            kind: action === 'approve' ? '' : 'warn',
          }),
        onError: () => {
          toast.push({ title: action === 'approve' ? 'Approve failed — restored' : 'Reject failed — restored', kind: 'error' });
          setLocalQueue((q) => [current, ...q]);
          setHistory((h) => {
            const i = h.findIndex((x) => x.id === current.id);
            if (i < 0) return h;
            const copy = [...h];
            copy.splice(i, 1);
            return copy;
          });
          setAnimKey((k) => k + 1);
        },
      });
      schedule(() => {
        setLocalQueue((q) => q.slice(1));
        setFlying(null);
        setAnimKey((k) => k + 1);
      }, 340);
    },
    [localQueue, flying, approve, reject, toast, schedule],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setLocalQueue((q) => [last.proposal, ...q]);
    setAnimKey((k) => k + 1);
  }, [history]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') { e.preventDefault(); decide('approve'); }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); decide('reject'); }
      else if (e.key === 'ArrowLeft' || e.key === 'u' || e.key === 'U') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, undo]);

  // Drag-to-swipe.
  const dragRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, dx: 0 });
  useEffect(() => {
    const card = dragRef.current;
    if (!card) return;
    const onDown = (e: PointerEvent) => {
      if (flying) return;
      const tag = (e.target as HTMLElement).tagName;
      if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'KBD'].includes(tag)) return;
      dragState.current = { dragging: true, startX: e.clientX, dx: 0 };
      card.style.transition = 'none';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      dragState.current.dx = dx;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 16}deg)`;
      const ov = card.querySelector<HTMLElement>('.verdict-overlay.approve');
      const ovR = card.querySelector<HTMLElement>('.verdict-overlay.reject');
      if (ov) ov.style.opacity = String(Math.min(1, Math.max(0, dx / 120)));
      if (ovR) ovR.style.opacity = String(Math.min(1, Math.max(0, -dx / 120)));
    };
    const onUp = () => {
      if (!dragState.current.dragging) return;
      const dx = dragState.current.dx;
      dragState.current.dragging = false;
      card.style.transition = '';
      card.querySelectorAll<HTMLElement>('.verdict-overlay').forEach((el) => { el.style.opacity = ''; });
      if (Math.abs(dx) > 140) decide(dx > 0 ? 'approve' : 'reject');
      else card.style.transform = '';
    };
    card.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      card.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [flying, decide]);

  const current = localQueue[0];
  const total = localQueue.length + history.length;
  const processedCount = history.length;

  // Distinguish "still loading the queue" from "queue genuinely empty": before the first
  // fetch resolves localQueue is [] but seeded is false, so don't flash "Queue cleared".
  if (!current && (isLoading || !seeded.current)) {
    return (
      <div className="page" data-testid="page-matches">
        <div className="card"><div className="card-body empty">Loading review queue…</div></div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="page" data-testid="page-matches">
        <div className="empty" style={{ padding: 80 }}>
          <I.Check size={32} style={{ color: 'var(--status-success)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, color: 'var(--text)' }}>Queue cleared.</div>
          <div style={{ marginTop: 6 }}>
            {total > 0 ? `All ${total} match proposals processed.` : 'No proposals awaiting review.'}
          </div>
          {total > 0 && (
            <button type="button" className="btn" style={{ marginTop: 18 }} onClick={() => { setLocalQueue(history.map((h) => h.proposal)); setHistory([]); setAnimKey((k) => k + 1); }}>
              <I.Replay size={12} /> Start over
            </button>
          )}
        </div>
      </div>
    );
  }

  const candHref = safeHttpUrl(current.candidate_url);
  const product = current.target?.product ?? null;
  const our = product?.our_price_cents ?? null;
  const cand = current.candidate_price_cents;
  const deltaPct = our != null && our !== 0 && cand != null ? ((cand - our) / our) * 100 : null;
  const next1 = localQueue[1];
  const next2 = localQueue[2];
  const evidence = current.evidence ?? [];

  return (
    <div className="page" data-testid="page-matches">
      <div className="page-head">
        <div>
          <h1 className="page-title">Matches review</h1>
          <p className="page-sub">
            Borderline confidence band <span className="mono">[60–85]</span> — human-in-the-loop required for EU AI Act Art. 14 compliance.
          </p>
        </div>
        <div className="page-actions">
          <span className="muted" style={{ fontSize: 12, marginRight: 12 }}>
            <Kbd>A</Kbd> approve · <Kbd>R</Kbd> reject · <Kbd>U</Kbd> undo · drag to swipe
          </span>
          <button type="button" className="btn sm" onClick={undo} disabled={history.length === 0}>
            <I.Replay size={11} /> Undo
          </button>
        </div>
      </div>

      <div className="queue-strip">
        <span className="queue-counter">
          <b>{processedCount + 1}</b> of {total} <span>· {localQueue.length} remaining</span>
        </span>
        <div className="queue-progress"><i style={{ width: `${total > 0 ? (processedCount / total) * 100 : 0}%`, transition: 'width 320ms' }} /></div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5, alignItems: 'center' }}>
          <span><b className="mono" style={{ color: 'var(--status-success)' }}>{history.filter((h) => h.action === 'approve').length}</b> <span className="muted">approved</span></span>
          <span><b className="mono" style={{ color: 'var(--status-failed)' }}>{history.filter((h) => h.action === 'reject').length}</b> <span className="muted">rejected</span></span>
          <div className="decision-strip">
            {history.slice(-12).map((h, i) => (
              <div key={`${h.id}-${i}`} className={`pip ${h.action} ${h.fresh ? 'new' : ''}`} />
            ))}
            {Array.from({ length: Math.max(0, 12 - history.length) }).map((_, i) => (
              <div key={`e${i}`} className="pip" />
            ))}
          </div>
        </div>
      </div>

      <div className="match-review match-deck">
        {/* LEFT — your product */}
        <div className="match-pane">
          <div className="match-pane-head">
            <span className="lbl">Your product</span>
            <span className="badge outline">Confirmed</span>
          </div>
          <div className="match-product-hero">
            <ProductImg img={product?.brand?.slice(0, 2)} lg />
            <div className="product-hero-meta">
              <h3 className="product-hero-title">{product?.name ?? '—'}</h3>
              <dl>
                <dt>SKU</dt><dd>{product?.sku ?? '—'}</dd>
                <dt>GTIN</dt><dd>{product?.gtin ?? '—'}</dd>
                <dt>MPN</dt><dd>{product?.mpn ?? '—'}</dd>
                <dt>Brand</dt><dd>{product?.brand ?? '—'}</dd>
              </dl>
            </div>
          </div>
          <div className="match-product-body">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <small style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your retail price</small>
              {our != null ? <Price cents={our} size="lg" /> : '—'}
            </div>
          </div>
        </div>

        {/* CENTER — candidate deck */}
        <div style={{ position: 'relative' }}>
          {next2 && <div className="match-ghost g2" />}
          {next1 && <div className="match-ghost g1" />}
          <div
            ref={dragRef}
            key={`${current.id}-${animKey}`}
            className={`match-pane candidate ${flying ? 'flying-' + (flying === 'approve' ? 'right' : 'left') : 'incoming'}`}
            style={{ position: 'relative' }}
          >
            <div className="verdict-overlay approve">APPROVE</div>
            <div className="verdict-overlay reject">REJECT</div>
            <div className="match-pane-head">
              <span className="lbl">Candidate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ConfidenceBadge value={current.confidence} />
                {current.candidate_host && <HostChip host={current.candidate_host} />}
              </div>
            </div>
            <div className="match-product-hero">
              <ProductImg img={current.candidate_host?.slice(0, 2)} lg />
              <div className="product-hero-meta">
                <h3 className="product-hero-title">{current.candidate_title ?? '—'}</h3>
                <dl>
                  <dt>URL</dt>
                  <dd>
                    {candHref ? (
                      <a href={candHref} className="id-link" target="_blank" rel="noreferrer noopener" style={{ wordBreak: 'break-all', fontSize: 11 }}>{current.candidate_url}</a>
                    ) : (
                      <span className="mono tertiary" style={{ wordBreak: 'break-all', fontSize: 11 }}>{current.candidate_url}</span>
                    )}
                  </dd>
                  <dt>Source</dt><dd>{current.candidate_host ?? '—'}</dd>
                  <dt>Method</dt><dd>AI cascade</dd>
                </dl>
              </div>
            </div>
            <div className="match-product-body">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <small style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Competitor price</small>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {cand != null ? <Price cents={cand} size="lg" /> : '—'}
                  {deltaPct != null && <PriceDelta pct={deltaPct} />}
                </div>
              </div>
            </div>
            <div className="match-actions">
              <button type="button" className="btn danger" onClick={() => decide('reject')}>
                <I.X size={13} /> Reject <Kbd>R</Kbd>
              </button>
              {candHref ? (
                <a className="btn" href={candHref} target="_blank" rel="noreferrer noopener">
                  <I.External size={13} /> Open
                </a>
              ) : (
                <button type="button" className="btn" disabled title="No openable URL">
                  <I.External size={13} /> Open
                </button>
              )}
              <button type="button" className="btn primary" onClick={() => decide('approve')}>
                <I.Check size={13} /> Confirm <Kbd>A</Kbd>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — evidence breakdown */}
        <div className="match-pane">
          <div className="match-pane-head">
            <span className="lbl">Evidence breakdown</span>
            <span className="muted" style={{ fontSize: 11 }}>{evidence.length} matchers</span>
          </div>
          <div className="evidence-pane">
            {evidence.map((e, i) => {
              const status = evidenceStatus(e);
              const color = status === 'match' ? 'var(--status-success)' : status === 'nomatch' ? 'var(--status-failed)' : 'var(--text-tertiary)';
              return (
                <div key={i} className={`evidence-row ${status}`}>
                  <div className="icon">
                    {status === 'match' && <I.Check size={11} />}
                    {status === 'nomatch' && <I.X size={11} />}
                    {status === 'skip' && <span style={{ fontSize: 10 }}>−</span>}
                  </div>
                  <div>
                    <div className="stepname" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {e.matcher}
                      {e.ai && <AiBadge />}
                    </div>
                    <div className="stepdesc">{e.label}</div>
                  </div>
                  <div className="evidence-score" style={{ color }}>
                    {e.matched === null ? (
                      <span style={{ color: 'var(--text-tertiary)' }}>skip</span>
                    ) : (
                      <>
                        <div><span className="pct">{e.score}</span><span style={{ color: 'var(--text-tertiary)' }}>/100</span></div>
                        <div className="evidence-bar" style={{ color, marginTop: 4 }}><i style={{ width: `${e.score}%` }} /></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="evidence-summary">
              <div className="label">Final confidence (LLM judge)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div className="big">{current.confidence}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>/ 100</div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`badge ${current.confidence >= 85 ? 'success' : 'paused'}`}>
                    <span className="dot" />
                    {current.confidence >= 85 ? 'auto-confirm' : 'human review'}
                  </span>
                </div>
              </div>
              <div className="ai-disclosure" style={{ marginTop: 8 }}>
                AI-assisted recommendation. Final decision is yours — logged for EU AI Act audit.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
