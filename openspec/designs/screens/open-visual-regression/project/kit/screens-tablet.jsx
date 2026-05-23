/* global React, Icon, Button, Badge, Glyph, KeyHint, Field, DiffStrip,
   Alert, AlertDialog, SegmentedProgress, Toast, ToastStack,
   Logs, CodeBlock, Command,
   TabletAppShell, TABLET_SIDEBAR_W,
   PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN, RECENT_RUNS,
   MOCKS, MOCK_W, MOCK_H */
// OVR — TABLET screens. 768×1024 portrait.
// Reuses the desktop visual vocabulary; collapses 2-col forms to 1-col,
// the diff render-error logs panel to a stacked block, and the pending
// stats grid to 2 columns.

// ===========================================================================
// PROJECTS
// ===========================================================================
function TProjectsScreen() {
  return (
    <TabletAppShell breadcrumb={{ view: 'projects' }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>projects</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>({PROJECTS.length})</span>
          <Button variant="primary" size="md" icon="plus" style={{ marginLeft: 'auto' }}>new project</Button>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {PROJECTS.map((p, i) => (
            <a key={p.id} href="#" onClick={(e) => e.preventDefault()} style={{
              display: 'flex', alignItems: 'center', height: 56, padding: '0 14px', gap: 12,
              borderBottom: i < PROJECTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              textDecoration: 'none', color: 'inherit',
            }}>
              <Icon name="folder" size={14} style={{ color: 'var(--fg-tertiary)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--fg-primary)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{p.runCount} runs · latest #{p.latestRunId} · {p.latestRunAge}</div>
              </div>
              {p.changedCount > 0 && (
                <Badge tone="accent">{p.changedCount} changed</Badge>
              )}
              <Icon name="chevronRight" size={12} style={{ color: 'var(--fg-tertiary)' }} />
            </a>
          ))}
        </div>
      </div>
    </TabletAppShell>
  );
}

function TProjectsEmptyScreen() {
  return (
    <TabletAppShell breadcrumb={{ view: 'projects' }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>projects</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>(0)</span>
          <Button variant="primary" size="md" icon="plus" style={{ marginLeft: 'auto' }}>new project</Button>
        </div>
        <div style={{
          height: 360,
          border: '1px dashed var(--border-default)',
          borderRadius: 4,
          background: 'var(--bg-base)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 2,
            border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-tertiary)', fontSize: 18,
          }}>∅</div>
          <div style={{ fontSize: 14, color: 'var(--fg-primary)' }}>no projects yet.</div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', maxWidth: 380, lineHeight: 1.6 }}>
            create a project to start receiving builds from the CLI. you&apos;ll need at least one variant before the first build can be accepted.
          </div>
          <Button variant="primary" size="md" icon="plus">create first project</Button>
        </div>
      </div>
    </TabletAppShell>
  );
}

function TNewProjectScreen({ slugTaken }) {
  return (
    <TabletAppShell breadcrumb={{ view: 'projects' }}>
      <div style={{ padding: 24, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 8 }}>
          <a href="#" style={{ color: 'var(--fg-tertiary)' }}>projects</a>
          <Icon name="chevronRight" size={11} /><span>new</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>new project</h1>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 6, marginBottom: 20, lineHeight: 1.5 }}>
          the slug is the CLI handle and appears in URLs. add variants after creation.
        </div>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 4, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <Field label="name" value="checkout flow" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>slug</label>
            <div style={{
              display: 'flex', alignItems: 'center', height: 32,
              background: 'var(--bg-elevated)',
              border: `1px solid ${slugTaken ? 'var(--diff-remove)' : 'var(--border-default)'}`,
              borderRadius: 2, overflow: 'hidden',
            }}>
              <span style={{ padding: '0 10px', fontSize: 12, color: 'var(--fg-muted)', borderRight: '1px solid var(--border-subtle)', height: '100%', display: 'flex', alignItems: 'center' }}>/</span>
              <input defaultValue="checkout-flow" style={{ flex: 1, height: '100%', padding: '0 10px', background: 'transparent', border: 'none', color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
            </div>
            {slugTaken && (
              <span style={{ fontSize: 11, color: 'var(--diff-remove)' }}>
                <Glyph kind="rejected" size={10} style={{ marginRight: 4 }} />slug already taken on this instance.
              </span>
            )}
          </div>
          <Field label="default branch" value="main" />
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="md">cancel</Button>
            <Button variant="primary" size="md" icon="plus" disabled={slugTaken} style={{ marginLeft: 'auto' }}>create project</Button>
          </div>
        </div>
      </div>
    </TabletAppShell>
  );
}

function TProjectSettingsScreen({ showAddVariant, withSavedToast }) {
  const project = PROJECTS[0];
  const variants = [
    { id: 'v1', name: 'desktop',         browser: 'chromium', w: 1280, h: 800 },
    { id: 'v2', name: 'desktop-firefox', browser: 'firefox',  w: 1280, h: 800 },
    { id: 'v3', name: 'mobile',          browser: 'chromium', w: 375,  h: 812 },
    { id: 'v4', name: 'tablet',          browser: 'chromium', w: 768,  h: 1024 },
  ];
  return (
    <TabletAppShell
      breadcrumb={{ project, view: 'settings' }}
      activeProjectId={project.id}
      toast={withSavedToast && (
        <Toast tone="neutral" title="settings saved" glyph="◐" dismissable={false}>
          changes to <span style={{ color: 'var(--fg-primary)' }}>checkout-flow</span> applied · 2s ago
        </Toast>
      )}
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>project settings</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          {[{k:'runs',l:'runs'},{k:'settings',l:'settings',active:true},{k:'api',l:'api'},{k:'logs',l:'logs'}].map((t) => (
            <button key={t.k} style={{
              padding: '8px 14px', background: 'transparent', border: 'none',
              borderBottom: t.active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: t.active ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', marginBottom: -1,
            }}>{t.l}</button>
          ))}
        </div>

        {/* general — single column on tablet */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)', marginBottom: 10 }}>general</div>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: 18,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <Field label="name" value="checkout-flow" />
            <Field label="slug" value="checkout-flow" />
            <Field label="default branch" value="main" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>diff threshold</label>
              <div style={{
                height: 32, padding: '0 10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 2, color: 'var(--fg-primary)', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>0.10</span>
                <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>% pixels</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="md" style={{ marginLeft: 'auto' }}>save changes</Button>
            </div>
          </div>
        </section>

        {/* variants */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>variants ({variants.length})</span>
            <Button variant="secondary" size="sm" icon="plus" style={{ marginLeft: 'auto' }}>add variant</Button>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            {variants.map((v, i) => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', gap: 12,
                borderBottom: i < variants.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontSize: 12,
              }}>
                <Icon name="monitor" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                <span style={{ flex: 1 }}>{v.name}</span>
                <span style={{ width: 90, color: 'var(--fg-secondary)', fontSize: 11 }}>{v.browser}</span>
                <span style={{ width: 90, color: 'var(--fg-tertiary)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{v.w}×{v.h}</span>
                <Button variant="ghost" size="sm" icon="x" />
              </div>
            ))}
          </div>
        </section>

        {/* danger zone */}
        <section style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--diff-remove)',
          borderRadius: 4, padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Glyph kind="rejected" />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--diff-remove)' }}>danger zone</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg-primary)', marginBottom: 4 }}>delete project</div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>permanently removes 47 builds, 564 snapshots, and all stored files. cannot be undone.</div>
            </div>
            <Button variant="destructive" size="md" style={{ alignSelf: 'flex-start' }}>delete project…</Button>
          </div>
        </section>
      </div>
    </TabletAppShell>
  );
}

function TDeleteProjectScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TProjectSettingsScreen />
      <AlertDialog
        tone="destructive"
        title="delete checkout-flow?"
        confirmLabel="delete project"
        cancelLabel="keep project"
        evidence={
          <div style={{ lineHeight: 1.6 }}>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 47 builds · 564 snapshots</div>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 12 baselines · 2.4 GB</div>
          </div>
        }
      >
        permanently deletes the project and everything under it. cannot be undone.
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>type slug to confirm</label>
          <input defaultValue="checkout-flow" style={{
            height: 32, padding: '0 10px',
            background: 'var(--bg-inset)',
            border: '1px solid var(--diff-remove)',
            borderRadius: 2, color: 'var(--fg-primary)',
            fontFamily: 'inherit', fontSize: 12, outline: 'none',
          }} />
        </div>
      </AlertDialog>
    </div>
  );
}

// ===========================================================================
// BUILDS
// ===========================================================================
function TRunsScreen() {
  const project = PROJECTS[0];
  const runs = RUNS_BY_PROJECT[project.id];
  return (
    <TabletAppShell breadcrumb={{ project, view: 'runs' }} activeProjectId={project.id}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>builds ({runs.length})</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['all', 'changed', 'passed', 'pending'].map((f, i) => (
              <button key={f} style={{
                height: 28, padding: '0 10px',
                background: i === 0 ? 'var(--bg-active)' : 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                color: i === 0 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {runs.slice(0, 9).map((r, i) => {
            const tone =
              r.status === 'changed' ? 'var(--accent-primary)'
              : r.status === 'passed' ? 'var(--diff-add)'
              : r.status === 'pending' ? 'var(--status-pending)'
              : r.status === 'failed' ? 'var(--diff-remove)' : 'var(--fg-muted)';
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'stretch',
                borderBottom: i < 8 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ width: 3, background: tone, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 70 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg-primary)' }}>#{r.id}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tone }}>{r.status}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-tertiary)', display: 'flex', gap: 8, marginTop: 2 }}>
                      <span>{r.branch}</span>·<span>{r.commit}</span>·<span>by {r.author}</span>
                    </div>
                  </div>
                  <div style={{ width: 90, fontSize: 11, color: 'var(--fg-tertiary)', textAlign: 'right' }}>
                    {r.changed > 0 && <span style={{ color: 'var(--accent-primary)' }}>Δ{r.changed} </span>}
                    {r.passed > 0 && <span style={{ color: 'var(--diff-add)' }}>✓{r.passed}</span>}
                  </div>
                  <div style={{ width: 50, fontSize: 10, color: 'var(--fg-tertiary)', textAlign: 'right' }}>{r.age}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TabletAppShell>
  );
}

function TRunDetailScreen({ withToast }) {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const snapshots = (SNAPSHOTS_BY_RUN[run.id] || []).slice(0, 6);
  const counts = {
    pass:    snapshots.filter((s) => s.status === 'pass').length,
    changed: snapshots.filter((s) => s.status === 'changed').length,
    fail:    snapshots.filter((s) => s.status === 'fail').length,
    pending: snapshots.filter((s) => s.status === 'pending').length,
  };
  return (
    <TabletAppShell
      breadcrumb={{ project, run: { id: run.id }, view: 'run' }}
      activeProjectId={project.id}
      toast={withToast && (
        <Toast tone="success" title={`run #${run.id} approved`} action={{ label: 'view' }}>
          {counts.changed} snapshots accepted · baseline updated
        </Toast>
      )}
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <DiffStrip status={run.status} style={{ width: 3, height: 48, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
              <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#{run.id}</h1>
              <Badge tone={run.status === 'changed' ? 'accent' : run.status === 'passed' ? 'pass' : 'pending'}>
                {run.status.toUpperCase()}
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {run.commit} · {run.message}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 6, flexWrap: 'wrap' }}>
              <span>{run.branch}</span>
              <span>by {run.author}</span>
              <span>{run.duration}</span>
              <span>{run.age}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['all', 'changed', 'passed', 'pending'].map((f, i) => (
            <button key={f} style={{
              height: 28, padding: '0 10px',
              background: i === 1 ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 2,
              color: i === 1 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>

        <div style={{
          marginBottom: 14, padding: '12px 14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
        }}>
          <SegmentedProgress
            title={`${snapshots.length} snapshots`}
            summary={`${counts.pass} pass · ${counts.changed} changed`}
            segments={[
              { label: 'pass',    count: counts.pass,    color: 'var(--diff-add)' },
              { label: 'changed', count: counts.changed, color: 'var(--accent-primary)' },
              { label: 'failed',  count: counts.fail,    color: 'var(--diff-remove)' },
              { label: 'pending', count: counts.pending, color: 'var(--status-pending)' },
            ]}
            height={8}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {snapshots.map((s, i) => {
            const mock = MOCKS[s.mock];
            const tone =
              s.status === 'changed' ? 'var(--accent-primary)'
              : s.status === 'passed' ? 'var(--diff-add)'
              : s.status === 'pending' ? 'var(--status-pending)' : 'var(--diff-remove)';
            return (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} style={{
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 4, overflow: 'hidden',
                textDecoration: 'none', color: 'inherit',
                borderTop: `2px solid ${tone}`,
              }}>
                <div style={{ aspectRatio: `${MOCK_W} / ${MOCK_H}`, background: '#fff', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${320 / MOCK_W})`, transformOrigin: 'top left' }}>
                    {mock && <mock.Component variant={s.status === 'changed' ? 'current' : 'baseline'} />}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--fg-tertiary)' }}>
                    <span style={{ color: tone, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.status}</span>
                    <span>·</span>
                    <span>{s.viewport}</span>
                    {s.deltaPct !== undefined && <span style={{ marginLeft: 'auto' }}>Δ {s.deltaPct.toFixed(2)}%</span>}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </TabletAppShell>
  );
}

function TPendingBuildScreen() {
  const project = PROJECTS[0];
  return (
    <TabletAppShell breadcrumb={{ project, run: { id: '1285' }, view: 'run' }} activeProjectId={project.id}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <DiffStrip status="pending" style={{ width: 3, height: 56, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
              <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#1285</h1>
              <Badge tone="pending">
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--status-pending)', marginRight: 4, animation: 'ovrShimmer 1.4s ease-in-out infinite' }} />
                RUNNING
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>a72f10c · feat: add gift-message field to checkout</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 6 }}>
              <span>pr/483</span>
              <span>by ari</span>
              <span>just now</span>
              <span>polling 5s</span>
            </div>
          </div>
          <Button variant="ghost" size="md" icon="x">cancel</Button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SegmentedProgress
            title="build #1285"
            subtitle="snapshots in flight"
            summary="29 / 48"
            segments={[
              { label: 'diffed',    count: 11, color: 'var(--diff-add)' },
              { label: 'capturing', count: 7,  color: 'var(--status-pending)' },
              { label: 'diffing',   count: 11, color: 'var(--accent-primary)' },
              { label: 'queued',    count: 19, color: 'var(--border-default)' },
            ]}
            height={8}
          />
        </div>

        {/* 2x2 grid on tablet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'queued',    n: 6,  c: 'var(--status-stale)' },
            { label: 'capturing', n: 7,  c: 'var(--status-pending)' },
            { label: 'diffing',   n: 11, c: 'var(--accent-primary)' },
            { label: 'completed', n: 0,  c: 'var(--diff-add)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)', marginBottom: 8 }}>snapshots <span style={{ color: 'var(--fg-muted)' }}>(streaming)</span></div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {[
            { name: 'cart-empty',                v: '1280×800', s: 'diffed',     d: 0.42 },
            { name: 'cart-empty.mobile',         v: '375×812',  s: 'diffed',     d: 0.00 },
            { name: 'cart-with-items',           v: '1280×800', s: 'diffing'              },
            { name: 'checkout-step-1-address',   v: '1280×800', s: 'capturing'            },
            { name: 'checkout-step-2-payment',   v: '1280×800', s: 'queued'               },
            { name: 'confirmation',              v: '1280×800', s: 'queued'               },
          ].map((s, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', height: 32, padding: '0 12px', gap: 12,
              borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
              opacity: s.s === 'queued' ? 0.55 : 1,
            }}>
              <span style={{
                color: s.s === 'diffed' ? 'var(--diff-add)' : s.s === 'queued' ? 'var(--fg-muted)' : 'var(--status-pending)',
                animation: ['diffing', 'capturing'].includes(s.s) ? 'ovrShimmer 1.4s ease-in-out infinite' : 'none',
              }}>{s.s === 'diffed' ? '○' : s.s === 'queued' ? '◌' : '◐'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span style={{ width: 90, color: 'var(--fg-tertiary)', fontSize: 11 }}>{s.v}</span>
              <span style={{ width: 70, fontSize: 11, color: s.s === 'diffed' ? 'var(--fg-secondary)' : 'var(--status-pending)', textAlign: 'right' }}>
                {s.s === 'diffed' && (s.d > 0 ? `Δ ${s.d.toFixed(2)}%` : 'pass')}
                {s.s !== 'diffed' && `${s.s}…`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </TabletAppShell>
  );
}

function TBuildErrorScreen() {
  const project = PROJECTS[0];
  return (
    <TabletAppShell breadcrumb={{ project, run: { id: '1280' }, view: 'run' }} activeProjectId={project.id}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <DiffStrip status="fail" style={{ width: 3, height: 56, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>run</span>
              <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>#1280</h1>
              <Badge tone="fail">ERROR</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>11ba9d3 · wip: payment retry</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 6 }}>
              <span>pr/479</span><span>by ari</span><span>5h ago</span>
            </div>
          </div>
          <Button variant="secondary" size="md" icon="rotateCcw">rerun</Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Alert tone="destructive" title="capture pipeline error · job exhausted after 5 attempts" dismissable={false}>
            <div style={{ marginTop: 4, color: 'var(--diff-remove)' }}>
              <strong style={{ fontWeight: 600 }}>baseline viewport mismatch.</strong> expected 1280×800, got 1280×720.
            </div>
          </Alert>
        </div>

        <div style={{ marginBottom: 16 }}>
          <CodeBlock
            label="stacktrace"
            filename="worker.ts"
            maxHeight={200}
            lines={[
              { text: "TypeError: viewport mismatch — expected 1280×800, got 1280×720", tone: 'error' },
              { text: "    at Playwright.page.setViewportSize  (worker.ts:142:18)" },
              { text: "    at captureSnapshot                   (services/snapshots.ts:48:7)" },
              { text: "    at Worker.processJob                 (bullmq:Worker:312:23)" },
              { text: "    at Worker._loopAttempt               (.../bullmq/Worker.js:198:9)", tone: 'dim' },
              { text: "    at Worker._runJob                    (.../bullmq/Worker.js:284:11)", tone: 'dim' },
            ]}
          />
        </div>
      </div>
    </TabletAppShell>
  );
}

// ===========================================================================
// DIFF
// ===========================================================================
function TDiffScreen() {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const snapshot = SNAPSHOTS_BY_RUN[run.id].find((s) => s.mock === 'checkoutPage');
  const mock = MOCKS[snapshot.mock];
  return (
    <TabletAppShell breadcrumb={{ project, run: { id: run.id }, view: 'diff' }} activeProjectId={project.id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 10,
          borderBottom: '1px solid var(--border-default)', background: 'var(--bg-base)',
          flexShrink: 0,
        }}>
          <Button variant="ghost" size="sm" icon="chevronLeft">back</Button>
          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snapshot.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{snapshot.viewport} · Δ {snapshot.deltaPct.toFixed(2)}%</div>
          </div>
          <Button variant="destructive" size="sm" icon="x">reject</Button>
          <Button variant="primary" size="sm" icon="check">approve</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 6, borderBottom: '1px solid var(--border-subtle)' }}>
          {['side-by-side', 'baseline', 'current', 'overlay', 'slider'].map((m, i) => (
            <button key={m} style={{
              height: 26, padding: '0 10px',
              background: i === 0 ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 2,
              color: i === 0 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            }}>{m}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-tertiary)' }}>
            <Glyph kind="changed" size={10} style={{ marginRight: 4 }} />1 changed region
          </div>
        </div>

        <div style={{
          flex: 1,
          background: 'var(--bg-inset)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          overflow: 'auto',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'safe center',
          padding: 16,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {['BASELINE', 'CURRENT'].map((label, idx) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg-secondary)' }}>{label}</span>
                <div style={{ width: 320, height: 320 * (MOCK_H / MOCK_W), border: idx === 1 ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)', background: '#fff', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${320 / MOCK_W})`, transformOrigin: 'top left' }}>
                    <mock.Component variant={idx === 0 ? 'baseline' : 'current'} />
                  </div>
                  {idx === 1 && (
                    <div style={{ position: 'absolute', top: '32%', left: '8%', right: '8%', height: 12, background: 'var(--diff-change-dim)', border: '1px solid var(--diff-change)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabletAppShell>
  );
}

function TDiffNoBaselineScreen() {
  const project = PROJECTS[0];
  return (
    <TabletAppShell breadcrumb={{ project, run: { id: '1284' }, view: 'diff' }} activeProjectId={project.id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 10,
          borderBottom: '1px solid var(--border-default)',
        }}>
          <Button variant="ghost" size="sm" icon="chevronLeft">back</Button>
          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>new-promo-banner</div>
            <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>1280×800 · <span style={{ color: 'var(--accent-primary)' }}>new · no baseline</span></div>
          </div>
          <Button variant="destructive" size="sm" icon="x">reject</Button>
          <Button variant="primary" size="sm" icon="check">approve as baseline</Button>
        </div>

        <div style={{
          flex: 1,
          background: 'var(--bg-inset)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          overflow: 'auto',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'safe center',
          padding: 16,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg-secondary)' }}>BASELINE · none</span>
              <div style={{
                width: 320, height: 320 * (MOCK_H / MOCK_W),
                border: '1px dashed var(--border-default)',
                background: 'var(--bg-base)',
                backgroundImage: 'var(--pixel-grid)',
                backgroundSize: 'var(--pixel-grid-size)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: 20, textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 2,
                  border: '1px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--fg-tertiary)', fontSize: 16,
                }}>∅</div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.5, maxWidth: 220 }}>
                  this story has never been approved on default. approve on a default-branch build to set the baseline.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg-secondary)' }}>CURRENT</span>
                <Badge tone="accent">new story</Badge>
              </div>
              <div style={{ width: 320, height: 320 * (MOCK_H / MOCK_W), border: '1px solid var(--border-default)', background: '#fff', overflow: 'hidden' }}>
                <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${320 / MOCK_W})`, transformOrigin: 'top left' }}>
                  <MOCKS.checkoutPage.Component variant="current" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabletAppShell>
  );
}

function TDiffRenderErrorScreen() {
  const project = PROJECTS[0];
  const mock = MOCKS.emptyCart;
  return (
    <TabletAppShell breadcrumb={{ project, run: { id: '1284' }, view: 'diff' }} activeProjectId={project.id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 10, borderBottom: '1px solid var(--border-default)' }}>
          <Button variant="ghost" size="sm" icon="chevronLeft">back</Button>
          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>cart-with-broken-promo</span>
              <Badge tone="fail">⚠ RENDER</Badge>
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>1280×800 · Δ 8.41%</div>
          </div>
          <Button variant="destructive" size="sm" icon="x">reject</Button>
          <Button variant="primary" size="sm" icon="check" disabled>approve</Button>
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Alert tone="destructive" title="2 console errors captured" dismissable={false}>
            screenshot still captured. review logs below before approving.
          </Alert>
        </div>

        {/* canvas */}
        <div style={{
          background: 'var(--bg-inset)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          padding: 16,
          display: 'flex', justifyContent: 'center', gap: 10,
          flexShrink: 0,
        }}>
          {['BASELINE', 'CURRENT'].map((label, idx) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg-secondary)' }}>{label}</span>
                {idx === 1 && <Badge tone="fail">render error</Badge>}
              </div>
              <div style={{ width: 280, height: 280 * (MOCK_H / MOCK_W), border: idx === 1 ? '2px solid var(--diff-remove)' : '1px solid var(--border-default)', background: '#fff', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${280 / MOCK_W})`, transformOrigin: 'top left' }}>
                  <mock.Component variant={idx === 0 ? 'baseline' : 'current'} />
                </div>
                {idx === 1 && <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.68 0.23 25 / 0.18)' }} />}
              </div>
            </div>
          ))}
        </div>

        {/* logs panel stacked below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-default)', minHeight: 0 }}>
          <Logs
            streaming={false}
            showFilter
            activeLevel="all"
            maxHeight="none"
            style={{ border: 'none', borderRadius: 0, height: '100%' }}
            entries={[
              { t: '00:00.142', lv: 'info',  source: 'ovr',       msg: 'navigating to story checkout-flow/cart-with-broken-promo' },
              { t: '00:00.521', lv: 'info',  source: 'storybook', msg: 'story rendered' },
              { t: '00:00.612', lv: 'warn',  source: 'browser',   msg: 'validateDOMNesting(...): <div> inside <p>' },
              { t: '00:00.701', lv: 'error', source: 'browser',   msg: "TypeError: Cannot read properties of undefined (reading 'discount')" },
              { t: '00:00.701', lv: 'error', source: 'browser',   msg: '   at PromoBanner (PromoBanner.tsx:42:18)' },
              { t: '00:00.812', lv: 'info',  source: 'ovr',       msg: 'capturing screenshot at 1280×800' },
              { t: '00:00.943', lv: 'info',  source: 'ovr',       msg: 'uploaded · builds/1284/cart-with-broken-promo.png' },
            ]}
          />
        </div>
      </div>
    </TabletAppShell>
  );
}

// ===========================================================================
// USERS & SETTINGS
// ===========================================================================
const T_USERS = [
  { id: 'u1', name: 'ari shapiro',     email: 'ari@acme.dev',     role: 'admin', last: '2m ago',   self: true  },
  { id: 'u2', name: 'jules ortega',    email: 'jules@acme.dev',   role: 'admin', last: '8m ago' },
  { id: 'u3', name: 'sam chen',        email: 'sam@acme.dev',     role: 'user',  last: '1h ago' },
  { id: 'u4', name: 'mo abrahams',     email: 'mo@acme.dev',      role: 'user',  last: '3h ago' },
  { id: 'u5', name: 'rena park',       email: 'rena@acme.dev',    role: 'user',  last: '2d ago' },
  { id: 'u6', name: 'theo nakamura',   email: 'theo@acme.dev',    role: 'user',  last: '14d ago', deactivated: true },
];
const T_INVITES = [
  { id: 'inv_8f3a', email: 'kira@acme.dev', by: 'ari',   exp: 'in 44h' },
  { id: 'inv_b211', email: 'lena@acme.dev', by: 'jules', exp: 'in 23h' },
  { id: 'inv_4cd0', email: 'park@acme.dev', by: 'ari',   exp: 'in 0h',  expiring: true },
];

function TUsersScreen({ withInviteUrl }) {
  return (
    <TabletAppShell breadcrumb={{ view: 'admin' }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>users</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>({T_USERS.length})</span>
          <Button variant="primary" size="md" icon="plus" style={{ marginLeft: 'auto' }}>invite user</Button>
        </div>

        {withInviteUrl && (
          <div style={{ marginBottom: 20 }}>
            <Alert tone="success" title="invitation created · expires in 48h">
              <div style={{
                marginTop: 6, padding: '8px 10px',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                fontSize: 11, color: 'var(--fg-primary)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://ovr.acme.dev/invite/inv_8f3a91b6c0d4e2f1</span>
                <Button variant="ghost" size="sm" icon="externalLink">copy</Button>
              </div>
            </Alert>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>pending invitations</span>
          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--fg-muted)' }}>({T_INVITES.length})</span>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)', marginBottom: 24 }}>
          {T_INVITES.map((inv, i) => (
            <div key={inv.id} style={{
              display: 'flex', alignItems: 'center', height: 36, padding: '0 12px', gap: 10,
              borderBottom: i < T_INVITES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
            }}>
              <Icon name="plus" size={12} style={{ color: 'var(--fg-tertiary)' }} />
              <span style={{ flex: 1 }}>{inv.email}</span>
              <span style={{ fontSize: 11, color: inv.expiring ? 'var(--status-stale)' : 'var(--fg-tertiary)' }}>
                {inv.expiring && <Glyph kind="stale" size={10} style={{ marginRight: 4 }} />}
                by {inv.by} · {inv.exp}
              </span>
              <Button variant="ghost" size="sm" icon="externalLink" />
              <Button variant="ghost" size="sm" icon="x" />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>members ({T_USERS.length})</span>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {T_USERS.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', height: 44, padding: '0 12px', gap: 10,
              borderBottom: i < T_USERS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
              opacity: u.deactivated ? 0.5 : 1,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 2, background: 'var(--bg-inset)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)', flexShrink: 0 }}>
                {u.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                  {u.self && <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>(you)</span>}
                  {u.deactivated && <Badge tone="fail">off</Badge>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              {u.role === 'admin' ? <Badge tone="accent">admin</Badge> : <Badge tone="neutral">user</Badge>}
              <span style={{ width: 70, color: 'var(--fg-tertiary)', fontSize: 10 }}>{u.last}</span>
              <Button variant="ghost" size="sm" icon="chevronDown" />
            </div>
          ))}
        </div>
      </div>
    </TabletAppShell>
  );
}

function TInviteModalScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TUsersScreen />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 440,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
        padding: 20,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em' }}>invite user</h2>
          <Button variant="ghost" size="sm" icon="x" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
          generates a single-use invitation token. share the URL with the recipient by any channel — no email is sent.
        </div>
        <Field label="email" value="kira@acme.dev" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>role</span>
          <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden' }}>
            <button style={{ flex: 1, height: 32, background: 'var(--bg-active)', border: 'none', color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12 }}>user</button>
            <button style={{ flex: 1, height: 32, background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-default)', color: 'var(--fg-tertiary)', fontFamily: 'inherit', fontSize: 12 }}>admin</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" size="md" style={{ marginLeft: 'auto' }}>cancel</Button>
          <Button variant="primary" size="md" icon="plus">create invitation</Button>
        </div>
      </div>
    </div>
  );
}

const T_KEYS = [
  { id: 'k1', name: 'ci · github actions',     created: '2026-04-14', lastUsed: '2m ago',     prefix: 'ovr_pk_•••' },
  { id: 'k2', name: 'local dev',                created: '2026-04-22', lastUsed: '4h ago',     prefix: 'ovr_pk_•••' },
  { id: 'k3', name: 'staging deploy',           created: '2026-05-02', lastUsed: '3d ago',     prefix: 'ovr_pk_•••' },
  { id: 'k4', name: 'experiment · phoenix',     created: '2026-03-30', lastUsed: 'never',      prefix: 'ovr_pk_•••', stale: true },
];

function TApiKeysScreen({ withReveal }) {
  return (
    <TabletAppShell breadcrumb={{ view: 'settings' }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>api keys</h1>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--fg-tertiary)' }}>({T_KEYS.length})</span>
          <Button variant="primary" size="md" icon="plus" style={{ marginLeft: 'auto' }}>new key</Button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 20, lineHeight: 1.5 }}>
          authenticates the CLI. the secret is shown <span style={{ color: 'var(--accent-primary)' }}>exactly once</span> at creation; only the key name + last-used timestamp are stored.
        </div>

        {withReveal && (
          <div style={{ marginBottom: 24 }}>
            <Alert tone="accent" title="copy this key now · shown once">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 2,
                  fontSize: 12, color: 'var(--fg-primary)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  wordBreak: 'break-all',
                }}>
                  <span style={{ flex: 1 }}>ovr_pk_live_9f2a8e6c4b1d0a3f5e7c9b2d4a6f8e0c</span>
                  <Button variant="secondary" size="sm" icon="externalLink">copy</Button>
                </div>
                <div style={{ color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
                  set <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>OVR_API_KEY</code> in CI, or pass <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>--api-key</code> to <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>ovr snapshot</code>.
                </div>
              </div>
            </Alert>
          </div>
        )}

        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          {T_KEYS.map((k, i) => (
            <div key={k.id} style={{
              display: 'flex', alignItems: 'center', height: 44, padding: '0 12px', gap: 10,
              borderBottom: i < T_KEYS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 12,
            }}>
              <Icon name="command" size={12} style={{ color: 'var(--fg-tertiary)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--fg-primary)' }}>{k.name}</div>
                <div style={{ fontSize: 10, color: k.stale ? 'var(--status-stale)' : 'var(--fg-tertiary)' }}>
                  {k.stale && <Glyph kind="stale" size={9} style={{ marginRight: 3 }} />}
                  {k.prefix} · created {k.created} · last used {k.lastUsed}
                </div>
              </div>
              <Button variant="ghost" size="sm" icon="x" />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>cli usage</span>
          <Command>ovr snapshot --project checkout-flow --api-key $OVR_API_KEY</Command>
          <CodeBlock
            label="ovr.config.ts"
            filename="ovr.config.ts"
            maxHeight={160}
            lines={[
              "import { defineConfig } from 'ovr';",
              "",
              "export default defineConfig({",
              "  serverUrl: 'https://ovr.acme.dev',",
              "  project:   'checkout-flow',",
              "  variants:  ['desktop', 'mobile'],",
              "});",
            ]}
          />
        </div>
      </div>
    </TabletAppShell>
  );
}

Object.assign(window, {
  TProjectsScreen, TProjectsEmptyScreen, TNewProjectScreen, TProjectSettingsScreen, TDeleteProjectScreen,
  TRunsScreen, TRunDetailScreen, TPendingBuildScreen, TBuildErrorScreen,
  TDiffScreen, TDiffNoBaselineScreen, TDiffRenderErrorScreen,
  TUsersScreen, TInviteModalScreen, TApiKeysScreen,
});
