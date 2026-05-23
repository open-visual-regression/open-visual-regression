/* global React, Icon, Button, Badge, Glyph, KeyHint, DiffStrip, MOCKS, MOCK_W, MOCK_H, PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN */
// OVR — main screens. ProjectsScreen, RunsScreen, RunDetailScreen, DiffScreen.

const { useState, useEffect, useRef } = React;

// ===========================================================================
// PROJECTS SCREEN — list of all projects
// ===========================================================================
function ProjectsScreen({ onNavigate }) {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, color: 'var(--fg-primary)' }}>projects</h1>
        <span style={{ marginLeft: 12, fontSize: 14, color: 'var(--fg-tertiary)' }}>({PROJECTS.length})</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" icon="filter">all</Button>
          <Button variant="primary"   size="md" icon="plus">new project</Button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12,
      }}>
        {PROJECTS.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate({ view: 'runs', projectId: p.id })}
            style={{
              textAlign: 'left',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              padding: 18,
              fontFamily: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              transition: 'border-color var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="folder" size={14} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{p.name}</span>
              {p.changedCount > 0 && (
                <span style={{ marginLeft: 'auto' }}>
                  <Badge tone="accent" filled>{p.changedCount} CHANGED</Badge>
                </span>
              )}
              {p.changedCount === 0 && (
                <span style={{ marginLeft: 'auto', color: 'var(--diff-add)', fontSize: 14 }}>○</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>{p.description}</div>
            <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 'auto' }}>
              <span><span style={{ color: 'var(--fg-muted)' }}>runs</span> {p.runCount}</span>
              <span><span style={{ color: 'var(--fg-muted)' }}>baseline</span> main</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// RUNS SCREEN — list of runs for a project
// ===========================================================================
function RunsScreen({ project, onNavigate }) {
  const runs = RUNS_BY_PROJECT[project.id] || [];
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? runs : runs.filter((r) => r.status === filter);

  return (
    <div style={{ padding: '24px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap' }}>{project.name}</h1>
        <span style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>{project.description}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" icon="play">trigger run</Button>
          <Button variant="ghost"     size="md" icon="settings" />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, marginTop: 16 }}>
        {['all', 'changed', 'pass', 'fail', 'pending'].map((f) => {
          const count = f === 'all' ? runs.length : runs.filter((r) => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 10px',
                background: filter === f ? 'var(--bg-active)' : 'transparent',
                border: 'none',
                borderBottom: filter === f ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: filter === f ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f}
              <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-tertiary)' }}>
          baseline: <span style={{ color: 'var(--fg-secondary)' }}>main · e0b14c2</span>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', height: 32,
          padding: '0 12px', gap: 12,
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-tertiary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{ width: 3 }} />
          <span style={{ width: 12, flexShrink: 0 }} />
          <span style={{ width: 48, flexShrink: 0 }}>run</span>
          <span style={{ flex: 1, minWidth: 0 }}>commit</span>
          <span style={{ width: 76, flexShrink: 0 }}>branch</span>
          <span style={{ width: 60, flexShrink: 0 }}>author</span>
          <span style={{ width: 96, textAlign: 'right', flexShrink: 0 }}>status</span>
          <span style={{ width: 64, textAlign: 'right', flexShrink: 0 }}>age</span>
        </div>
        {filtered.map((r) => (
          <RunRow key={r.id} run={r} onClick={() => onNavigate({ view: 'run', projectId: project.id, runId: r.id })} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '48px 12px', textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)' }}>
            no runs in this filter.
          </div>
        )}
      </div>
    </div>
  );
}

function RunRow({ run, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: hover ? 'var(--bg-hover)' : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        height: 36,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <DiffStrip status={run.status} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 9px', gap: 12, flex: 1, fontSize: 12, minWidth: 0, whiteSpace: 'nowrap' }}>
        <Glyph kind={run.status === 'changed' ? 'changed' : run.status === 'pending' ? 'pending' : run.status === 'fail' ? 'changed' : 'passed'} size={12} />
        <span style={{ color: 'var(--fg-tertiary)', width: 48, flexShrink: 0 }}>#{run.id}</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: 'var(--fg-tertiary)', fontSize: 11, flexShrink: 0 }}>{run.commit.slice(0, 7)}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{run.message}</span>
          {run.approved && <span style={{ flexShrink: 0 }}><Badge tone="pass">✓ APPROVED</Badge></span>}
          {run.errorNote && <span style={{ fontSize: 10, color: 'var(--diff-remove)', flexShrink: 0 }}>· {run.errorNote}</span>}
        </div>
        <span style={{ width: 76, color: 'var(--fg-secondary)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{run.branch}</span>
        <span style={{ width: 60, color: 'var(--fg-tertiary)', fontSize: 11, flexShrink: 0 }}>{run.author}</span>
        <span style={{ width: 96, textAlign: 'right', flexShrink: 0 }}>
          {run.status === 'changed' && <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{run.changed} changed</span>}
          {run.status === 'pass'    && <span style={{ color: 'var(--diff-add)' }}>pass</span>}
          {run.status === 'fail'    && <span style={{ color: 'var(--diff-remove)' }}>fail</span>}
          {run.status === 'pending' && <span style={{ color: 'var(--status-pending)' }}>running…</span>}
        </span>
        <span style={{ width: 64, textAlign: 'right', color: 'var(--fg-tertiary)', fontSize: 11, flexShrink: 0 }}>{run.age}</span>
      </div>
    </div>
  );
}

// ===========================================================================
// RUN DETAIL — snapshot grid
// ===========================================================================
function RunDetailScreen({ project, run, onNavigate }) {
  const snapshots = SNAPSHOTS_BY_RUN[run.id] || generateSyntheticSnapshots(run);
  const [filter, setFilter] = useState(run.status === 'changed' ? 'changed' : 'all');
  const filtered = filter === 'all' ? snapshots : snapshots.filter((s) => s.status === filter);

  return (
    <div style={{ padding: '24px 40px' }}>
      {/* run header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <DiffStrip status={run.status} style={{ width: 3, height: 56, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#{run.id}</h1>
            {run.status === 'changed' && <Badge tone="accent" filled>{run.changed} CHANGED</Badge>}
            {run.status === 'pass'    && <Badge tone="pass">PASS</Badge>}
            {run.status === 'fail'    && <Badge tone="fail">FAIL</Badge>}
            {run.status === 'pending' && <Badge tone="pending">PENDING</Badge>}
            {run.approved && <Badge tone="pass">✓ APPROVED</Badge>}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--fg-secondary)' }}>
            <span><Icon name="gitCommit" size={11} style={{ verticalAlign: -1, marginRight: 4, color: 'var(--fg-tertiary)' }} />{run.commit.slice(0,7)} · {run.message}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}><Icon name="gitBranch" size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{run.branch}</span>
            <span style={{ whiteSpace: 'nowrap' }}>by {run.author}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{run.duration}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{run.age}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{snapshots.length} snapshots · {snapshots.filter((s) => s.status === 'changed').length} changed</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost"     size="md" icon="rotateCcw">rerun</Button>
          <Button variant="secondary" size="md">reject all</Button>
          <Button variant="primary"   size="md" icon="check">approve all</Button>
        </div>
      </div>

      {/* error note */}
      {run.errorNote && (
        <div style={{
          padding: '10px 14px', marginBottom: 16,
          background: 'var(--diff-remove-dim)',
          border: '1px solid var(--diff-remove)',
          borderRadius: 2,
          fontSize: 12, color: 'var(--diff-remove)',
        }}>
          <strong style={{ fontWeight: 600 }}>error · </strong>{run.errorNote}. expected 1280×800, got 1280×720.
        </div>
      )}

      {/* filter tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        {['all', 'changed', 'pass'].map((f) => {
          const count = f === 'all' ? snapshots.length : snapshots.filter((s) => s.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 10px',
                background: filter === f ? 'var(--bg-active)' : 'transparent',
                border: 'none',
                borderBottom: filter === f ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: filter === f ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f}
              <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* snapshot grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12,
      }}>
        {filtered.map((s) => (
          <SnapshotCard
            key={s.id} snapshot={s}
            onClick={() => s.mock && onNavigate({ view: 'diff', projectId: project.id, runId: run.id, snapshotId: s.id })}
          />
        ))}
      </div>
    </div>
  );
}

// fallback if a run doesn't have a SNAPSHOTS entry
function generateSyntheticSnapshots(run) {
  const arr = [];
  for (let i = 0; i < run.total; i++) {
    arr.push({
      id: `snap-${i}`, name: `snapshot-${i}`, viewport: '1280×800', browser: 'chromium-117',
      status: i < run.changed ? 'changed' : 'pass',
    });
  }
  return arr;
}

function SnapshotCard({ snapshot, onClick }) {
  const [hover, setHover] = useState(false);
  const mock = snapshot.mock && MOCKS[snapshot.mock];
  const clickable = !!mock;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${hover && clickable ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius: 4, overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        height: 160,
        background: 'var(--bg-inset)',
        backgroundImage: 'var(--pixel-grid)',
        backgroundSize: 'var(--pixel-grid-size)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {mock && (
          <ThumbnailMock
            Component={mock.Component}
            regions={mock.regions}
            showDiff={snapshot.status === 'changed'}
          />
        )}
        {!mock && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 11 }}>
            no preview
          </div>
        )}
        {snapshot.status === 'changed' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Badge tone="accent" filled>Δ {snapshot.deltaPct?.toFixed(2)}%</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Glyph kind={snapshot.status === 'changed' ? 'changed' : 'passed'} size={11} />
          <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{snapshot.name}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{snapshot.viewport} · {snapshot.browser}</div>
      </div>
    </div>
  );
}

// Renders a mock screen, scaled down to thumbnail size, with optional diff overlay.
function ThumbnailMock({ Component, regions, showDiff }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    setScale(w / MOCK_W);
  }, []);
  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        width: MOCK_W, height: MOCK_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute', top: 0, left: 0,
      }}>
        <Component variant={showDiff ? 'current' : 'baseline'} />
        {showDiff && regions && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {regions.map((r, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: r.x, top: r.y, width: r.w, height: r.h,
                background: r.kind === 'add' ? 'oklch(0.78 0.20 145 / 0.45)'
                           : r.kind === 'remove' ? 'oklch(0.68 0.23 25 / 0.45)'
                           : 'oklch(0.80 0.20 75 / 0.45)',
                outline: '2px solid ' + (r.kind === 'add' ? 'oklch(0.78 0.20 145)'
                                       : r.kind === 'remove' ? 'oklch(0.68 0.23 25)'
                                       : 'oklch(0.80 0.20 75)'),
                outlineOffset: 0,
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// DIFF VIEWER — the core comparison UI
// ===========================================================================
function DiffScreen({ project, run, snapshot, onNavigate }) {
  const mock = snapshot.mock && MOCKS[snapshot.mock];
  const [mode, setMode] = useState('side'); // 'side' | 'overlay' | 'slider'
  const [showOverlay, setShowOverlay] = useState(true);
  const [sliderPct, setSliderPct] = useState(50);
  const [verdict, setVerdict] = useState(null); // 'approved' | 'rejected'

  // snapshots in this run, for prev/next
  const all = SNAPSHOTS_BY_RUN[run.id] || [];
  const changedOnes = all.filter((s) => s.status === 'changed');
  const idx = changedOnes.findIndex((s) => s.id === snapshot.id);
  const prev = idx > 0 ? changedOnes[idx - 1] : null;
  const next = idx >= 0 && idx < changedOnes.length - 1 ? changedOnes[idx + 1] : null;

  if (!mock) {
    return (
      <div style={{ padding: 48, color: 'var(--fg-muted)' }}>no diff available for this snapshot.</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* diff toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 16px', gap: 12,
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-base)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        <Button variant="ghost" size="sm" icon="chevronLeft"
          onClick={() => onNavigate({ view: 'run', projectId: project.id, runId: run.id })}>back</Button>
        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden', flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{snapshot.name}</span>
          <span style={{ fontSize: 10, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{snapshot.viewport} · {snapshot.browser} · Δ {snapshot.deltaPct?.toFixed(2)}%</span>
        </div>

        {/* mode switcher — icon + label */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
          {[
            { key: 'side',    label: 'side',    icon: 'columns' },
            { key: 'overlay', label: 'overlay', icon: 'layers' },
            { key: 'slider',  label: 'slider',  icon: 'arrowLeftRight' },
          ].map((m) => (
            <button
              key={m.key} onClick={() => setMode(m.key)}
              title={m.label}
              style={{
                height: 28, padding: '0 10px', gap: 6,
                background: mode === m.key ? 'var(--bg-active)' : 'var(--bg-elevated)',
                color: mode === m.key ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                border: 'none',
                borderLeft: m.key !== 'side' ? '1px solid var(--border-default)' : 'none',
                fontFamily: 'inherit', fontSize: 11,
                display: 'inline-flex', alignItems: 'center',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={m.icon} size={12} />
              {m.label}
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" icon={showOverlay ? 'eye' : 'eyeOff'}
          onClick={() => setShowOverlay(!showOverlay)} title={showOverlay ? 'hide overlay' : 'show overlay'} />

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        {verdict === 'approved' && <Badge tone="pass">✓ APPROVED</Badge>}
        {verdict === 'rejected' && <Badge tone="fail">✗ REJECTED</Badge>}
        {!verdict && (
          <>
            <Button variant="destructive" size="sm" icon="x" onClick={() => setVerdict('rejected')}>reject</Button>
            <Button variant="primary"     size="sm" icon="check" onClick={() => setVerdict('approved')}>approve</Button>
          </>
        )}
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
        minWidth: 0,
      }}>
        {mode === 'side' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <DiffFrame label="BASELINE" sub="main · e0b14c2" Component={mock.Component} variant="baseline" regions={mock.regions} showOverlay={showOverlay} width={320} kindFilter="remove" />
            <DiffFrame label="CURRENT"  sub={`${run.branch} · ${run.commit.slice(0,7)}`} Component={mock.Component} variant="current"  regions={mock.regions} showOverlay={showOverlay} width={320} kindFilter={['change', 'add']} />
          </div>
        )}
        {mode === 'overlay' && (
          <DiffFrame label="OVERLAY" sub="baseline ↔ current"
            Component={mock.Component} variant="current"
            regions={mock.regions}
            showOverlay={showOverlay}
            width={640}
            kindFilter="all" />
        )}
        {mode === 'slider' && (
          <DiffSlider Component={mock.Component} regions={mock.regions} showOverlay={showOverlay} pct={sliderPct} setPct={setSliderPct} />
        )}
      </div>

      {/* footer nav */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 20px', gap: 12,
        borderTop: '1px solid var(--border-default)',
        background: 'var(--bg-base)',
        flexShrink: 0, fontSize: 11, color: 'var(--fg-tertiary)',
      }}>
        <span>{idx + 1} of {changedOnes.length} changed</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <KeyHint>J</KeyHint>
          <span>next</span>
          <KeyHint>K</KeyHint>
          <span>prev</span>
          <KeyHint>A</KeyHint>
          <span>approve</span>
          <KeyHint>R</KeyHint>
          <span>reject</span>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 8px' }} />
          <Button variant="ghost" size="sm" icon="chevronLeft" disabled={!prev}
            onClick={() => prev && onNavigate({ view: 'diff', projectId: project.id, runId: run.id, snapshotId: prev.id })}>prev</Button>
          <Button variant="ghost" size="sm" iconRight="chevronRight" disabled={!next}
            onClick={() => next && onNavigate({ view: 'diff', projectId: project.id, runId: run.id, snapshotId: next.id })}>next</Button>
        </div>
      </div>
    </div>
  );
}

// A single labeled "screen" frame — baseline or current.
function DiffFrame({ label, sub, Component, variant, regions, showOverlay, width = 540, kindFilter }) {
  const scale = width / MOCK_W;
  const height = MOCK_H * scale;
  const filtered = !regions ? [] :
    kindFilter === 'all' ? regions :
    Array.isArray(kindFilter) ? regions.filter((r) => kindFilter.includes(r.kind)) :
    regions.filter((r) => r.kind === kindFilter);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-secondary)',
        }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{sub}</span>
      </div>
      <div style={{
        width, height,
        border: '1px solid var(--border-default)',
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
      }}>
        <div style={{
          width: MOCK_W, height: MOCK_H,
          transform: `scale(${scale})`, transformOrigin: 'top left',
        }}>
          <Component variant={variant} />
          {showOverlay && filtered.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {filtered.map((r, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: r.x, top: r.y, width: r.w, height: r.h,
                  background: r.kind === 'add' ? 'oklch(0.78 0.20 145 / 0.40)'
                             : r.kind === 'remove' ? 'oklch(0.68 0.23 25 / 0.40)'
                             : 'oklch(0.80 0.20 75 / 0.40)',
                  outline: '2px solid ' + (r.kind === 'add' ? 'oklch(0.78 0.20 145)'
                                         : r.kind === 'remove' ? 'oklch(0.68 0.23 25)'
                                         : 'oklch(0.80 0.20 75)'),
                  outlineOffset: 0,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffSlider({ Component, regions, showOverlay, pct, setPct }) {
  const width = 880;
  const scale = width / MOCK_W;
  const height = MOCK_H * scale;
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const onDown = (e) => { dragging.current = true; move(e); };
  const onUp = () => { dragging.current = false; };
  const move = (e) => {
    if (!dragging.current && e.type !== 'mousedown') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) / rect.width * 100;
    setPct(Math.max(0, Math.min(100, x)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>BASELINE</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>CURRENT</span>
      </div>
      <div
        ref={containerRef}
        onMouseDown={onDown}
        onMouseMove={move}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        style={{
          width, height,
          border: '1px solid var(--border-default)',
          position: 'relative',
          overflow: 'hidden',
          background: '#fff',
          cursor: 'ew-resize',
          userSelect: 'none',
        }}
      >
        {/* baseline (full) */}
        <div style={{ position: 'absolute', inset: 0, width: MOCK_W, height: MOCK_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Component variant="baseline" />
        </div>
        {/* current (clipped) */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${pct}%)`, width: MOCK_W, height: MOCK_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Component variant="current" />
          {showOverlay && regions && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {regions.map((r, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: r.x, top: r.y, width: r.w, height: r.h,
                  background: 'oklch(0.80 0.20 75 / 0.4)',
                  outline: '2px solid oklch(0.80 0.20 75)',
                }} />
              ))}
            </div>
          )}
        </div>
        {/* divider */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${pct}%`,
          width: 2, background: 'var(--accent-primary)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          width: 28, height: 28, marginLeft: -14, marginTop: -14,
          background: 'var(--accent-primary)', color: 'var(--fg-on-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600,
          borderRadius: 2,
          pointerEvents: 'none',
        }}>↔</div>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectsScreen, RunsScreen, RunDetailScreen, DiffScreen });
