/* global React, Icon, Button, Badge, Glyph, KeyHint, Field, AppShell, PROJECTS, RECENT_RUNS, AlertDialog, Toast, ToastStack */
// OVR — project management: NewProjectScreen, ProjectSettingsScreen, DeleteProjectScreen

// ---------------------------------------------------------------------------
// NEW PROJECT — /projects/new
// ---------------------------------------------------------------------------
function NewProjectScreen({ slugTaken }) {
  return (
    <AppShell breadcrumb={{ project: null, view: 'projects' }}>
      <div style={{ padding: '32px 40px', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 12 }}>
          <a href="#" style={{ color: 'var(--fg-tertiary)' }}>projects</a>
          <Icon name="chevronRight" size={12} />
          <span>new</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>new project</h1>
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', marginTop: 8, marginBottom: 28, lineHeight: 1.5 }}>
          a project groups runs of a single storybook. the slug is the CLI handle and appears in URLs. you can add variants after creation.
        </div>

        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 4, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <Field label="name" value="checkout flow" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>slug</label>
            <div style={{
              display: 'flex', alignItems: 'center', height: 32,
              background: 'var(--bg-elevated)',
              border: `1px solid ${slugTaken ? 'var(--diff-remove)' : 'var(--border-default)'}`,
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <span style={{ padding: '0 10px', fontSize: 12, color: 'var(--fg-muted)', borderRight: '1px solid var(--border-subtle)', height: '100%', display: 'flex', alignItems: 'center' }}>/</span>
              <input
                defaultValue="checkout-flow"
                style={{
                  flex: 1, height: '100%', padding: '0 10px',
                  background: 'transparent', border: 'none',
                  color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: slugTaken ? 'var(--diff-remove)' : 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {slugTaken && <Glyph kind="rejected" size={10} />}
              {slugTaken ? 'slug "checkout-flow" is already taken on this instance.' : 'lowercase, dashes, no spaces. used in CLI and URLs.'}
            </span>
          </div>
          <Field label="default branch" value="main" />
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: -10 }}>baselines come from the most recent approved build on this branch.</div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="md">cancel</Button>
            <Button variant="primary" size="md" icon="plus" style={{ marginLeft: 'auto' }} disabled={slugTaken}>create project</Button>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 2, fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.6 }}>
          <div style={{ color: 'var(--fg-secondary)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>next step</div>
          after creation, define at least one <span style={{ color: 'var(--fg-secondary)' }}>variant</span> (browser + viewport) — without one, the project rejects build submissions.
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// PROJECT SETTINGS — /projects/[slug]/settings  (variants + delete)
// ---------------------------------------------------------------------------
const VARIANTS = [
  { id: 'v1', name: 'desktop',         browser: 'chromium', w: 1280, h: 800 },
  { id: 'v2', name: 'desktop-firefox', browser: 'firefox',  w: 1280, h: 800 },
  { id: 'v3', name: 'mobile',          browser: 'chromium', w: 375,  h: 812 },
  { id: 'v4', name: 'tablet',          browser: 'chromium', w: 768,  h: 1024 },
];

function ProjectSettingsScreen({ showAddVariant, withSavedToast }) {
  const project = PROJECTS[0]; // checkout-flow
  return (
    <AppShell
      breadcrumb={{ project: { id: project.id, name: project.name }, view: 'settings' }}
      activeProjectId={project.id}
      toast={withSavedToast && (
        <Toast tone="neutral" title="settings saved" glyph="◐" dismissable={false}>
          changes to <span style={{ color: 'var(--fg-primary)' }}>checkout-flow</span> applied · 2s ago
        </Toast>
      )}
    >
      <div style={{ padding: '24px 40px', maxWidth: 980 }}>
        {/* tabs */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
          <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--fg-tertiary)' }}>project settings</span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { k: 'runs', l: 'runs' },
            { k: 'settings', l: 'settings', active: true },
            { k: 'api', l: 'api' },
            { k: 'logs', l: 'logs' },
          ].map((t) => (
            <button key={t.k} style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: t.active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: t.active ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', marginBottom: -1,
            }}>{t.l}</button>
          ))}
        </div>

        {/* general */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>general</span>
          </div>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
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
                borderRadius: 2,
                color: 'var(--fg-primary)',
                fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>0.10</span>
                <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>% pixels</span>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <Button variant="primary" size="md" style={{ marginLeft: 'auto' }}>save changes</Button>
            </div>
          </div>
        </section>

        {/* variants */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>variants</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-muted)' }}>({VARIANTS.length})</span>
            <div style={{ marginLeft: 'auto' }}>
              <Button variant="secondary" size="sm" icon="plus">add variant</Button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginBottom: 12, lineHeight: 1.6 }}>
            each story is snapshotted once per variant per build. at least one variant is required for the project to accept builds.
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', height: 30, padding: '0 12px', gap: 12,
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--fg-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ flex: 1 }}>name</span>
              <span style={{ width: 120 }}>browser</span>
              <span style={{ width: 110 }}>viewport</span>
              <span style={{ width: 32 }} />
            </div>
            {VARIANTS.map((v, i) => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', gap: 12,
                borderBottom: i < VARIANTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontSize: 12,
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="monitor" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                  <span>{v.name}</span>
                </div>
                <span style={{ width: 120, color: 'var(--fg-secondary)', fontSize: 11 }}>{v.browser}</span>
                <span style={{ width: 110, color: 'var(--fg-tertiary)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{v.w}×{v.h}</span>
                <Button variant="ghost" size="sm" icon="x" title="remove" />
              </div>
            ))}

            {showAddVariant && (
              <div style={{
                display: 'flex', alignItems: 'center', height: 52, padding: '0 12px', gap: 8,
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-inset)',
              }}>
                <input placeholder="name" defaultValue="" style={{
                  flex: 1, height: 28, padding: '0 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2,
                  color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, outline: 'none',
                }} />
                <select style={{
                  width: 120, height: 28, padding: '0 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2,
                  color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, outline: 'none',
                }}>
                  <option>chromium</option>
                  <option>firefox</option>
                  <option>webkit</option>
                </select>
                <input placeholder="w" defaultValue="1440" style={{
                  width: 60, height: 28, padding: '0 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2,
                  color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, outline: 'none', textAlign: 'right',
                }} />
                <span style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>×</span>
                <input placeholder="h" defaultValue="900" style={{
                  width: 60, height: 28, padding: '0 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2,
                  color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, outline: 'none', textAlign: 'right',
                }} />
                <Button variant="ghost" size="sm">cancel</Button>
                <Button variant="primary" size="sm" icon="check">add</Button>
              </div>
            )}
          </div>
        </section>

        {/* danger zone */}
        <section>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--diff-remove)',
            borderRadius: 4,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Glyph kind="rejected" />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--diff-remove)' }}>danger zone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-primary)', marginBottom: 4 }}>delete project</div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.6 }}>
                  permanently removes the project, <strong style={{ color: 'var(--fg-secondary)' }}>47 builds</strong>, <strong style={{ color: 'var(--fg-secondary)' }}>564 snapshots</strong>, and all stored files in object storage. cannot be undone.
                </div>
              </div>
              <Button variant="destructive" size="md">delete project…</Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// DELETE CONFIRM — AlertDialog over project settings
// ---------------------------------------------------------------------------
function DeleteProjectScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ProjectSettingsScreen />
      <AlertDialog
        tone="destructive"
        title="delete checkout-flow?"
        confirmLabel="delete project"
        cancelLabel="keep project"
        evidence={
          <div style={{ lineHeight: 1.6 }}>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 47 builds</div>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 564 snapshots</div>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 12 baselines</div>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 2.4 GB stored files</div>
          </div>
        }
      >
        this will permanently delete the project and everything stored under it. cannot be undone.
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>
            type the project slug to confirm
          </label>
          <input defaultValue="checkout-flow" style={{
            height: 32, padding: '0 10px',
            background: 'var(--bg-inset)',
            border: '1px solid var(--diff-remove)',
            borderRadius: 2,
            color: 'var(--fg-primary)',
            fontFamily: 'inherit', fontSize: 12,
            outline: 'none',
          }} />
        </div>
      </AlertDialog>
    </div>
  );
}

Object.assign(window, { NewProjectScreen, ProjectSettingsScreen, DeleteProjectScreen });
