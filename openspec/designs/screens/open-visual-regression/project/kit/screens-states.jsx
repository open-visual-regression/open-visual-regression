/* global React, Icon, Button, Badge, Glyph, KeyHint, DiffStrip, AppShell, MOCKS, MOCK_W, MOCK_H, PROJECTS, RECENT_RUNS, Alert, SegmentedProgress, Logs, CodeBlock */
// OVR — special states: PendingBuildScreen, BuildErrorScreen, DiffNoBaselineScreen, DiffRenderErrorScreen, EmptyProjectsScreen, EmptyBuildsScreen

const { useState: useStateState, useEffect: useStateEffect } = React;

// ---------------------------------------------------------------------------
// PENDING BUILD — build is running. counts update live via polling.
// ---------------------------------------------------------------------------
function PendingBuildScreen() {
  const project = PROJECTS[0]; // checkout-flow
  const run = { id: '1285', branch: 'pr/483', commit: 'a72f10c', message: 'feat: add gift-message field to checkout', author: 'ari', age: 'just now' };

  // 12 stories × 2 variants = 24. simulate live progress.
  const total = 24;
  const captured = 18;
  const queued = total - captured;
  const diffed = 11;

  return (
    <AppShell
      breadcrumb={{ project: { id: project.id, name: project.name }, run: { id: run.id }, view: 'run' }}
      activeProjectId={project.id}
    >
      <div style={{ padding: '24px 40px' }}>
        {/* run header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <DiffStrip status="pending" style={{ width: 3, height: 56, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
              <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#{run.id}</h1>
              <Badge tone="pending">
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--status-pending)', marginRight: 4, animation: 'ovrShimmer 1.4s ease-in-out infinite' }} />
                RUNNING
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
              <Icon name="gitCommit" size={11} style={{ verticalAlign: -1, marginRight: 4, color: 'var(--fg-tertiary)' }} />
              {run.commit} · {run.message}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 8, flexWrap: 'wrap' }}>
              <span><Icon name="gitBranch" size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{run.branch}</span>
              <span>by {run.author}</span>
              <span>started {run.age}</span>
              <span>polling every 5s</span>
            </div>
          </div>
          <Button variant="ghost" size="md" icon="x">cancel run</Button>
        </div>

        {/* progress bar */}
        <div style={{ marginBottom: 24 }}>
          <SegmentedProgress
            title={`build #${run.id}`}
            subtitle="snapshots in flight"
            summary={`${captured + diffed} / ${total * 2}`}
            segments={[
              { label: 'diffed',     count: diffed,            color: 'var(--diff-add)' },
              { label: 'capturing',  count: captured - diffed, color: 'var(--status-pending)' },
              { label: 'diffing',    count: diffed,            color: 'var(--accent-primary)' },
              { label: 'queued',     count: queued,            color: 'var(--border-default)' },
            ]}
            height={8}
          />
        </div>

        {/* phase counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'queued',     count: queued,            color: 'var(--status-stale)',   glyph: '◌' },
            { label: 'capturing',  count: captured - diffed, color: 'var(--status-pending)', glyph: '◐', live: true },
            { label: 'diffing',    count: diffed,            color: 'var(--accent-primary)', glyph: '◐', live: true },
            { label: 'completed',  count: 0,                 color: 'var(--diff-add)',       glyph: '○' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: s.color, fontSize: 12, animation: s.live ? 'ovrShimmer 1.4s ease-in-out infinite' : 'none' }}>{s.glyph}</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 500, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* live snapshot list */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>snapshots</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-muted)' }}>(streaming · polled 5s ago)</span>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {[
            { name: 'cart-empty',                   v: '1280×800', s: 'diffed',     d: 0.42 },
            { name: 'cart-empty.mobile',            v: '375×812',  s: 'diffed',     d: 0.00 },
            { name: 'cart-with-items',              v: '1280×800', s: 'diffed',     d: 1.84 },
            { name: 'cart-with-items.mobile',       v: '375×812',  s: 'diffing'              },
            { name: 'checkout-step-1-address',      v: '1280×800', s: 'diffing'              },
            { name: 'checkout-step-1-address.mob',  v: '375×812',  s: 'captured'             },
            { name: 'checkout-step-2-payment',      v: '1280×800', s: 'captured'             },
            { name: 'checkout-step-2-payment.mob',  v: '375×812',  s: 'capturing'            },
            { name: 'checkout-step-3-review',       v: '1280×800', s: 'capturing'            },
            { name: 'checkout-step-3-review.mob',   v: '375×812',  s: 'queued'               },
            { name: 'confirmation',                 v: '1280×800', s: 'queued'               },
            { name: 'confirmation.mobile',          v: '375×812',  s: 'queued'               },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', height: 32, padding: '0 12px', gap: 12,
              borderBottom: i < 11 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
              opacity: s.s === 'queued' ? 0.55 : 1,
            }}>
              <span style={{
                width: 12,
                color: s.s === 'diffed' ? 'var(--diff-add)'
                  : s.s === 'diffing' || s.s === 'capturing' ? 'var(--status-pending)'
                  : s.s === 'captured' ? 'var(--accent-primary)'
                  : 'var(--fg-muted)',
                animation: s.s === 'diffing' || s.s === 'capturing' ? 'ovrShimmer 1.4s ease-in-out infinite' : 'none',
              }}>
                {s.s === 'diffed' ? '○' : s.s === 'capturing' || s.s === 'diffing' ? '◐' : s.s === 'captured' ? '●' : '◌'}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span style={{ width: 90, color: 'var(--fg-tertiary)', fontSize: 11 }}>{s.v}</span>
              <span style={{ width: 90, fontSize: 11, color:
                  s.s === 'diffed' ? 'var(--fg-secondary)'
                  : s.s === 'diffing' || s.s === 'capturing' ? 'var(--status-pending)'
                  : 'var(--fg-tertiary)',
                textAlign: 'right',
              }}>
                {s.s === 'diffed' && (s.d > 0 ? `Δ ${s.d.toFixed(2)}%` : 'pass')}
                {s.s !== 'diffed' && s.s}
                {s.s === 'diffing' && '…'}
                {s.s === 'capturing' && '…'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 2, fontSize: 11, color: 'var(--fg-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Glyph kind="pending" size={11} />
          worker · 3 of 4 capture concurrency in use · 5 attempts max · exponential backoff (2s base)
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// BUILD ERROR — pipeline-level failure (e.g. worker exhausted retries)
// ---------------------------------------------------------------------------
function BuildErrorScreen() {
  const project = PROJECTS[0];
  const run = { id: '1280', branch: 'pr/479', commit: '11ba9d3', message: 'wip: payment retry', author: 'ari', age: '5h ago', duration: '0.4s' };

  return (
    <AppShell
      breadcrumb={{ project: { id: project.id, name: project.name }, run: { id: run.id }, view: 'run' }}
      activeProjectId={project.id}
    >
      <div style={{ padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <DiffStrip status="fail" style={{ width: 3, height: 56, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
              <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#{run.id}</h1>
              <Badge tone="fail">ERROR</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
              <Icon name="gitCommit" size={11} style={{ verticalAlign: -1, marginRight: 4, color: 'var(--fg-tertiary)' }} />
              {run.commit} · {run.message}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 8, flexWrap: 'wrap' }}>
              <span><Icon name="gitBranch" size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{run.branch}</span>
              <span>by {run.author}</span>
              <span>{run.duration}</span>
              <span>{run.age}</span>
              <span>3 / 12 captures errored</span>
            </div>
          </div>
          <Button variant="secondary" size="md" icon="rotateCcw">rerun</Button>
        </div>

        {/* error card */}
        <div style={{ marginBottom: 20 }}>
          <Alert tone="destructive" title="capture pipeline error · job exhausted after 5 attempts" dismissable={false}>
            <div style={{ marginTop: 4, color: 'var(--diff-remove)' }}>
              <strong style={{ fontWeight: 600 }}>baseline viewport mismatch.</strong> expected 1280×800, got 1280×720.
            </div>
          </Alert>
        </div>

        {/* stack trace */}
        <div style={{ marginBottom: 20 }}>
          <CodeBlock
            label="stacktrace"
            filename="worker.ts"
            lines={[
              { text: "TypeError: viewport mismatch — expected 1280×800, got 1280×720", tone: 'error' },
              { text: "    at Playwright.page.setViewportSize  (worker.ts:142:18)" },
              { text: "    at captureSnapshot                   (services/snapshots.ts:48:7)" },
              { text: "    at Worker.processJob                 (bullmq:Worker:312:23)" },
              { text: "    at Worker._loopAttempt               (.../bullmq/dist/cjs/Worker.js:198:9)", tone: 'dim' },
              { text: "    at Worker._runJob                    (.../bullmq/dist/cjs/Worker.js:284:11)", tone: 'dim' },
              { text: "→ snapshot marked 'error'" },
              { text: "→ build:finalize re-triggered" },
            ]}
          />
        </div>

        {/* error snapshots */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>errored snapshots</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-muted)' }}>(3)</span>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {[
            { name: 'cart-empty',         v: '1280×800', err: 'viewport mismatch' },
            { name: 'cart-with-items',    v: '1280×800', err: 'viewport mismatch' },
            { name: 'checkout-step-1',    v: '1280×800', err: 'viewport mismatch' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', height: 36, padding: '0 12px', gap: 12,
              borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
            }}>
              <Glyph kind="rejected" />
              <span style={{ flex: 1 }}>{s.name}</span>
              <span style={{ width: 90, color: 'var(--fg-tertiary)', fontSize: 11 }}>{s.v}</span>
              <span style={{ width: 200, color: 'var(--diff-remove)', fontSize: 11 }}>{s.err}</span>
              <Button variant="ghost" size="sm" icon="rotateCcw" title="retry" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// DIFF — NO BASELINE (new story, first time seen on default branch)
// ---------------------------------------------------------------------------
function DiffNoBaselineScreen() {
  const project = PROJECTS[0];
  const run = { id: '1284', branch: 'pr/482', commit: '4f2a91e' };
  const snapshot = { name: 'new-promo-banner', viewport: '1280×800', browser: 'chromium-117' };
  const mock = MOCKS['checkoutPage'];

  return (
    <AppShell
      breadcrumb={{ project: { id: project.id, name: project.name }, run: { id: run.id }, view: 'diff' }}
      activeProjectId={project.id}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12,
          borderBottom: '1px solid var(--border-default)', background: 'var(--bg-base)',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <Button variant="ghost" size="sm" icon="chevronLeft">back</Button>
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden', flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{snapshot.name}</span>
            <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{snapshot.viewport} · {snapshot.browser} · <span style={{ color: 'var(--accent-primary)' }}>new · no baseline</span></span>
          </div>
          <Button variant="destructive" size="sm" icon="x">reject</Button>
          <Button variant="primary" size="sm" icon="check">approve as baseline</Button>
        </div>

        {/* canvas */}
        <div style={{
          flex: 1,
          background: 'var(--bg-inset)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'safe center',
          padding: 24,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* baseline panel — empty state */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>BASELINE</span>
                <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>none on file</span>
              </div>
              <div style={{
                width: 360, height: 360 * (MOCK_H / MOCK_W),
                border: '1px dashed var(--border-default)',
                background: 'var(--bg-base)',
                backgroundImage: 'var(--pixel-grid)',
                backgroundSize: 'var(--pixel-grid-size)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 24, textAlign: 'center',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 2,
                  border: '1px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--fg-tertiary)', fontSize: 18,
                }}>∅</div>
                <div style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>no baseline yet</div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.5, maxWidth: 240 }}>
                  this story has never been approved on the default branch. approving on a default-branch build sets the baseline. on a feature branch, the diff stays open.
                </div>
              </div>
            </div>

            {/* current panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>CURRENT</span>
                <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{run.branch} · {run.commit.slice(0,7)}</span>
                <Badge tone="accent" style={{ marginLeft: 4 }}>new story</Badge>
              </div>
              <div style={{
                width: 360, height: 360 * (MOCK_H / MOCK_W),
                border: '1px solid var(--border-default)',
                background: '#fff', overflow: 'hidden', position: 'relative',
              }}>
                <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${360 / MOCK_W})`, transformOrigin: 'top left' }}>
                  <mock.Component variant="current" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 20px', gap: 12,
          borderTop: '1px solid var(--border-default)', background: 'var(--bg-base)',
          flexShrink: 0, fontSize: 11, color: 'var(--fg-tertiary)',
        }}>
          <Glyph kind="delta" size={11} />
          <span>first-run · approving on default branch will set this snapshot as the baseline for future comparisons.</span>
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// DIFF — RENDER ERROR (story threw a JS error during render)
// ---------------------------------------------------------------------------
function DiffRenderErrorScreen() {
  const project = PROJECTS[0];
  const run = { id: '1284', branch: 'pr/482', commit: '4f2a91e' };
  const snapshot = { name: 'cart-with-broken-promo', viewport: '1280×800', browser: 'chromium-117', deltaPct: 8.41 };
  const mock = MOCKS['emptyCart'];

  return (
    <AppShell
      breadcrumb={{ project: { id: project.id, name: project.name }, run: { id: run.id }, view: 'diff' }}
      activeProjectId={project.id}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12,
          borderBottom: '1px solid var(--border-default)', background: 'var(--bg-base)',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <Button variant="ghost" size="sm" icon="chevronLeft">back</Button>
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{snapshot.name}</span>
              <Badge tone="fail">⚠ RENDER ERROR</Badge>
            </div>
            <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{snapshot.viewport} · {snapshot.browser} · Δ {snapshot.deltaPct.toFixed(2)}%</span>
          </div>
          <Button variant="destructive" size="sm" icon="x">reject</Button>
          <Button variant="primary" size="sm" icon="check" disabled>approve</Button>
        </div>

        {/* error banner */}
        <div style={{ padding: '10px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-default)' }}>
          <Alert tone="destructive" title="2 console errors captured" dismissable={false}>
            screenshot still captured. review logs before approving.
          </Alert>
        </div>

        {/* split: canvas + logs */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{
            flex: 1,
            background: 'var(--bg-inset)',
            backgroundImage: 'var(--pixel-grid)',
            backgroundSize: 'var(--pixel-grid-size)',
            overflow: 'auto',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'safe center',
            padding: 24,
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>BASELINE</span>
                <div style={{ width: 280, height: 280 * (MOCK_H / MOCK_W), border: '1px solid var(--border-default)', background: '#fff', overflow: 'hidden' }}>
                  <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${280 / MOCK_W})`, transformOrigin: 'top left' }}>
                    <mock.Component variant="baseline" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>CURRENT</span>
                  <Badge tone="fail">render error</Badge>
                </div>
                <div style={{ width: 280, height: 280 * (MOCK_H / MOCK_W), border: '2px solid var(--diff-remove)', background: '#fff', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${280 / MOCK_W})`, transformOrigin: 'top left' }}>
                    <mock.Component variant="current" />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.68 0.23 25 / 0.18)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          {/* logs panel */}
          <div style={{
            width: 380, flexShrink: 0,
            borderLeft: '1px solid var(--border-default)',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-base)',
            minHeight: 0,
          }}>
            <Logs
              streaming={false}
              showFilter
              activeLevel="all"
              maxHeight="none"
              style={{ border: 'none', borderRadius: 0, height: '100%' }}
              entries={[
                { t: '00:00.142', lv: 'info',  source: 'ovr',       msg: 'navigating to story checkout-flow/cart-with-broken-promo' },
                { t: '00:00.418', lv: 'debug', source: 'ovr',       msg: 'dom-ready · waiting for fonts' },
                { t: '00:00.521', lv: 'info',  source: 'storybook', msg: 'story rendered' },
                { t: '00:00.612', lv: 'warn',  source: 'browser',   msg: 'validateDOMNesting(...): <div> in <p>' },
                { t: '00:00.701', lv: 'error', source: 'browser',   msg: "TypeError: Cannot read properties of undefined (reading 'discount')" },
                { t: '00:00.701', lv: 'error', source: 'browser',   msg: '   at PromoBanner (PromoBanner.tsx:42:18)' },
                { t: '00:00.702', lv: 'error', source: 'browser',   msg: '   at Cart (Cart.tsx:118:9)' },
                { t: '00:00.812', lv: 'info',  source: 'ovr',       msg: 'capturing screenshot at 1280×800' },
                { t: '00:00.943', lv: 'info',  source: 'ovr',       msg: 'uploaded · builds/1284/cart-with-broken-promo.png' },
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

Object.assign(window, { PendingBuildScreen, BuildErrorScreen, DiffNoBaselineScreen, DiffRenderErrorScreen });
