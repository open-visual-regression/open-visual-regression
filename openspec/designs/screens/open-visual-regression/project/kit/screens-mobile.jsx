/* global React, Icon, Button, Badge, Glyph, KeyHint, Field, OvrMark,
   Alert, AlertDialog, SegmentedProgress, Toast, ToastStack,
   Logs, CodeBlock, Command,
   MobileAppShell, MobileTopBar, MobileDrawer, MobileTabBar, MobileActionBar,
   MOBILE_TOPBAR_H, MOBILE_TABBAR_H,
   PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN, MOCKS, MOCK_W, MOCK_H */
// OVR — MOBILE screens. 375×812.

// ===========================================================================
// AUTH (centered cards, just constrained to 375)
// ===========================================================================
function MAuthShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg-base)',
      backgroundImage: 'var(--pixel-grid)',
      backgroundSize: 'var(--pixel-grid-size)',
      display: 'flex', flexDirection: 'column',
      padding: 16, gap: 20,
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 40 }}>
        <OvrMark size={22} />
        <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>ovr</span>
      </div>
      {children}
    </div>
  );
}

function MAuthCard({ title, sub, children, footer }) {
  return (
    <>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        padding: 18,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: '-0.02em' }}>{title}</h1>
          {sub && <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>{sub}</div>}
        </div>
        {children}
      </div>
      {footer && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', textAlign: 'center' }}>{footer}</div>}
    </>
  );
}

function MSetupScreen() {
  return (
    <MAuthShell>
      <MAuthCard title="first-run setup" sub="no users exist yet. create the organization and the first admin." footer="self-hosted · v0.4.2">
        <div style={{ display: 'flex', gap: 6, fontSize: 9, color: 'var(--fg-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent-primary)' }}>01 org</span>
          <span>·</span>
          <span style={{ color: 'var(--accent-primary)' }}>02 admin</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>organization</span>
          <Field label="org name" value="acme" />
        </div>
        <div style={{ height: 1, background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>admin account</span>
          <Field label="name" value="ari shapiro" />
          <Field label="email" value="ari@acme.dev" />
          <Field label="password" value="••••••••••••" />
        </div>
        <Button variant="primary" size="lg" iconRight="chevronRight" style={{ width: '100%', justifyContent: 'center' }}>
          create admin
        </Button>
      </MAuthCard>
    </MAuthShell>
  );
}

function MLoginScreen({ error }) {
  return (
    <MAuthShell>
      <MAuthCard
        title="sign in"
        sub="invitation-only. no public signup."
        footer={<>need an account? ask an admin to invite you.</>}
      >
        <Field label="email" value="ari@acme.dev" />
        <Field label="password" value="••••••••••••" />
        {error && (
          <Alert tone="destructive" title="invalid credentials" dismissable={false}>
            check your email and password.
          </Alert>
        )}
        <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>sign in</Button>
      </MAuthCard>
    </MAuthShell>
  );
}

function MInviteScreen({ state = 'valid' }) {
  if (state === 'expired') {
    return (
      <MAuthShell>
        <MAuthCard title="invitation expired" sub="tokens are single-use and expire 48h after issuance.">
          <Alert tone="pending" title="token expired 1 day ago" dismissable={false}>
            <div style={{ marginTop: 2, lineHeight: 1.6 }}>
              <div>id · inv_8f3a91b</div>
              <div>issued · 2026-05-19 14:22 utc</div>
            </div>
          </Alert>
          <Button variant="secondary" size="md" style={{ width: '100%', justifyContent: 'center' }}>return to sign in</Button>
        </MAuthCard>
      </MAuthShell>
    );
  }
  if (state === 'used') {
    return (
      <MAuthShell>
        <MAuthCard title="invitation already used" sub="each invitation can be accepted exactly once.">
          <Alert tone="destructive" title="token consumed" dismissable={false}>
            <div style={{ marginTop: 2, lineHeight: 1.6 }}>
              <div>by · jules@acme.dev</div>
              <div>at · 2026-05-20 09:14 utc</div>
            </div>
          </Alert>
          <Button variant="primary" size="md" style={{ width: '100%', justifyContent: 'center' }}>sign in instead</Button>
        </MAuthCard>
      </MAuthShell>
    );
  }
  return (
    <MAuthShell>
      <MAuthCard
        title="create account"
        sub={<>invited to <span style={{ color: 'var(--fg-primary)' }}>acme</span> as <span style={{ color: 'var(--accent-primary)' }}>user</span>.</>}
        footer={<>token expires in <span style={{ color: 'var(--fg-secondary)' }}>47h 12m</span></>}
      >
        <div style={{
          padding: '8px 10px',
          background: 'var(--bg-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 2,
          fontSize: 11, color: 'var(--fg-tertiary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="check" size={12} style={{ color: 'var(--diff-add)' }} />
          <span style={{ color: 'var(--fg-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>jules@acme.dev</span>
          <span>verified</span>
        </div>
        <Field label="name" value="jules ortega" />
        <Field label="password" value="••••••••••••" />
        <Field label="confirm" value="••••••••••••" />
        <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>create account</Button>
      </MAuthCard>
    </MAuthShell>
  );
}

// ===========================================================================
// PROJECTS
// ===========================================================================

// project row card
function MProjectCard({ project }) {
  const status = project.changedCount > 0 ? 'changed' : 'passed';
  const tone = status === 'changed' ? 'var(--accent-primary)' : 'var(--diff-add)';
  return (
    <a href="#" onClick={(e) => e.preventDefault()} style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 4,
      textDecoration: 'none', color: 'inherit',
      overflow: 'hidden',
    }}>
      <div style={{ width: 3, background: tone, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)' }}>{project.name}</span>
          {project.changedCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>· {project.changedCount} changed</span>
          )}
          <Icon name="chevronRight" size={12} style={{ marginLeft: 'auto', color: 'var(--fg-tertiary)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <span>#{project.latestRunId}</span>
          <span>·</span>
          <span>{project.latestRunAge}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{project.runCount} runs</span>
        </div>
      </div>
    </a>
  );
}

function MProjectsScreen() {
  return (
    <MobileAppShell
      title="projects"
      subtitle={`${PROJECTS.length} on this instance`}
      trailing={<Button variant="primary" size="sm" icon="plus" style={{ height: 32 }} />}
      bottomBar={<MobileTabBar active="projects" />}
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PROJECTS.map((p) => <MProjectCard key={p.id} project={p} />)}
      </div>
    </MobileAppShell>
  );
}

function MProjectsEmptyScreen() {
  return (
    <MobileAppShell
      title="projects"
      subtitle="0 on this instance"
      bottomBar={<MobileTabBar active="projects" />}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 2,
          border: '1px solid var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg-tertiary)', fontSize: 22,
        }}>∅</div>
        <div style={{ fontSize: 15, color: 'var(--fg-primary)' }}>no projects yet</div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5, maxWidth: 280 }}>
          create a project to start receiving builds from the CLI. at least one variant (browser + viewport) is required before the first build is accepted.
        </div>
        <Button variant="primary" size="lg" icon="plus">create first project</Button>
      </div>
    </MobileAppShell>
  );
}

function MNewProjectScreen({ slugTaken }) {
  return (
    <MobileAppShell
      title="new project"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
          the slug is the CLI handle and appears in URLs. add variants after creation.
        </div>
        <Field label="name" value="checkout flow" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>slug</label>
          <div style={{
            display: 'flex', alignItems: 'center', height: 36,
            background: 'var(--bg-elevated)',
            border: `1px solid ${slugTaken ? 'var(--diff-remove)' : 'var(--border-default)'}`,
            borderRadius: 2, overflow: 'hidden',
          }}>
            <span style={{ padding: '0 10px', fontSize: 12, color: 'var(--fg-muted)', borderRight: '1px solid var(--border-subtle)', height: '100%', display: 'flex', alignItems: 'center' }}>/</span>
            <input defaultValue="checkout-flow" style={{
              flex: 1, height: '100%', padding: '0 10px',
              background: 'transparent', border: 'none',
              color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
            }} />
          </div>
          {slugTaken && (
            <span style={{ fontSize: 11, color: 'var(--diff-remove)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Glyph kind="rejected" size={10} />slug "checkout-flow" is already taken.
            </span>
          )}
        </div>
        <Field label="default branch" value="main" />
        <Button variant="primary" size="lg" icon="plus" disabled={slugTaken} style={{ marginTop: 8, justifyContent: 'center' }}>create project</Button>
      </div>
    </MobileAppShell>
  );
}

function MProjectSettingsScreen({ withSavedToast }) {
  const project = PROJECTS[0];
  const variants = [
    { name: 'desktop',         browser: 'chromium', w: 1280, h: 800 },
    { name: 'desktop-firefox', browser: 'firefox',  w: 1280, h: 800 },
    { name: 'mobile',          browser: 'chromium', w: 375,  h: 812 },
    { name: 'tablet',          browser: 'chromium', w: 768,  h: 1024 },
  ];
  return (
    <MobileAppShell
      title={project.name}
      subtitle="project settings"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      toast={withSavedToast && (
        <Toast tone="neutral" title="settings saved" glyph="◐" dismissable={false} width="100%">
          changes to <span style={{ color: 'var(--fg-primary)' }}>checkout-flow</span> applied
        </Toast>
      )}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 8px', gap: 0 }}>
        {['runs', 'settings', 'api', 'logs'].map((t, i) => (
          <button key={t} style={{
            padding: '10px 12px', background: 'transparent', border: 'none',
            borderBottom: i === 1 ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: i === 1 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
            fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* general */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>general</span>
          <Field label="name" value="checkout-flow" />
          <Field label="default branch" value="main" />
        </section>

        {/* variants */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>variants ({variants.length})</span>
            <Button variant="secondary" size="sm" icon="plus" style={{ marginLeft: 'auto' }}>add</Button>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            {variants.map((v, i) => (
              <div key={v.name} style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10,
                borderBottom: i < variants.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontSize: 12,
              }}>
                <Icon name="monitor" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--fg-primary)' }}>{v.name}</div>
                  <div style={{ color: 'var(--fg-tertiary)', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{v.browser} · {v.w}×{v.h}</div>
                </div>
                <Button variant="ghost" size="sm" icon="x" />
              </div>
            ))}
          </div>
        </section>

        {/* danger */}
        <section style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--diff-remove)',
          borderRadius: 4, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph kind="rejected" />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--diff-remove)' }}>danger zone</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
            permanently removes the project, 47 builds, 564 snapshots, and all stored files.
          </div>
          <Button variant="destructive" size="md" style={{ width: '100%', justifyContent: 'center' }}>delete project…</Button>
        </section>
      </div>
    </MobileAppShell>
  );
}

function MDeleteProjectScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MProjectSettingsScreen />
      <AlertDialog
        tone="destructive"
        title="delete checkout-flow?"
        confirmLabel="delete"
        cancelLabel="keep"
        evidence={
          <div style={{ lineHeight: 1.6 }}>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 47 builds · 564 snapshots</div>
            <div><span style={{ color: 'var(--diff-remove)' }}>✗</span> 12 baselines · 2.4 GB</div>
          </div>
        }
      >
        cannot be undone.
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
// BUILDS / RUNS
// ===========================================================================

function MRunsScreen() {
  const project = PROJECTS[0];
  const runs = RUNS_BY_PROJECT[project.id];
  return (
    <MobileAppShell
      title={project.name}
      subtitle="builds"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
    >
      <div style={{ display: 'flex', padding: '8px 12px', gap: 6, overflowX: 'auto' }}>
        {['all', 'changed', 'passed', 'pending', 'failed'].map((f, i) => (
          <button key={f} style={{
            height: 28, padding: '0 10px',
            background: i === 0 ? 'var(--bg-active)' : 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            color: i === 0 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{f}</button>
        ))}
      </div>
      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {runs.slice(0, 8).map((r) => {
          const tone =
            r.status === 'changed' ? 'var(--accent-primary)'
            : r.status === 'passed' ? 'var(--diff-add)'
            : r.status === 'pending' ? 'var(--status-pending)'
            : r.status === 'failed' ? 'var(--diff-remove)' : 'var(--fg-muted)';
          return (
            <a key={r.id} href="#" onClick={(e) => e.preventDefault()} style={{
              display: 'flex', alignItems: 'stretch',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              textDecoration: 'none', color: 'inherit',
              overflow: 'hidden',
            }}>
              <div style={{ width: 3, background: tone, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>#{r.id}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tone }}>{r.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-tertiary)' }}>{r.age}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--fg-tertiary)' }}>
                  <Icon name="gitBranch" size={10} />
                  <span>{r.branch}</span>
                  <span>·</span>
                  <span>{r.commit}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {r.changed > 0 && <span style={{ color: 'var(--accent-primary)' }}>Δ{r.changed} </span>}
                    {r.passed > 0 && <span style={{ color: 'var(--diff-add)' }}>✓{r.passed}</span>}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </MobileAppShell>
  );
}

function MRunDetailScreen({ withToast }) {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const snapshots = SNAPSHOTS_BY_RUN[run.id] || [];
  return (
    <MobileAppShell
      title={`#${run.id}`}
      subtitle={`${run.branch} · ${run.message}`}
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      toast={withToast && (
        <Toast tone="success" title={`run #${run.id} approved`} action={{ label: 'view' }} width="100%">
          {snapshots.filter((s) => s.status === 'changed').length} snapshots accepted
        </Toast>
      )}
    >
      <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <Badge tone="accent">CHANGED</Badge>
        <span style={{ color: 'var(--fg-tertiary)' }}>{run.commit} · by {run.author}</span>
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <SegmentedProgress
          title={`${snapshots.length} snapshots`}
          summary={`${snapshots.filter((s) => s.status === 'pass').length} pass`}
          segments={[
            { label: 'pass',    count: snapshots.filter((s) => s.status === 'pass').length,    color: 'var(--diff-add)' },
            { label: 'changed', count: snapshots.filter((s) => s.status === 'changed').length, color: 'var(--accent-primary)' },
            { label: 'failed',  count: snapshots.filter((s) => s.status === 'fail').length,    color: 'var(--diff-remove)' },
          ]}
          height={6}
          legend={false}
        />
      </div>
      <div style={{ padding: '0 12px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {['all', 'changed', 'passed', 'pending'].map((f, i) => (
          <button key={f} style={{
            height: 28, padding: '0 10px',
            background: i === 0 ? 'var(--bg-active)' : 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            color: i === 0 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{f}</button>
        ))}
      </div>
      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {snapshots.slice(0, 6).map((s, i) => {
          const mock = MOCKS[s.mock];
          const tone =
            s.status === 'changed' ? 'var(--accent-primary)'
            : s.status === 'passed' ? 'var(--diff-add)'
            : s.status === 'pending' ? 'var(--status-pending)' : 'var(--diff-remove)';
          return (
            <a key={i} href="#" onClick={(e) => e.preventDefault()} style={{
              display: 'flex', gap: 10, padding: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4, textDecoration: 'none', color: 'inherit',
              borderLeft: `3px solid ${tone}`,
            }}>
              <div style={{ width: 100, height: 64, background: '#fff', overflow: 'hidden', position: 'relative', borderRadius: 2, flexShrink: 0 }}>
                <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${100 / MOCK_W})`, transformOrigin: 'top left' }}>
                  {mock && <mock.Component variant="current" />}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{s.viewport}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', fontSize: 10 }}>
                  <span style={{ color: tone, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.status}</span>
                  {s.deltaPct !== undefined && <span style={{ color: 'var(--fg-tertiary)' }}>Δ {s.deltaPct.toFixed(2)}%</span>}
                </div>
              </div>
              <Icon name="chevronRight" size={12} style={{ color: 'var(--fg-tertiary)', alignSelf: 'center' }} />
            </a>
          );
        })}
      </div>
    </MobileAppShell>
  );
}

function MPendingBuildScreen() {
  const project = PROJECTS[0];
  return (
    <MobileAppShell
      title="#1285"
      subtitle="pr/483 · feat: gift-message"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      trailing={<Button variant="ghost" size="sm" icon="x" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
    >
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone="pending">
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--status-pending)', marginRight: 4, animation: 'ovrShimmer 1.4s ease-in-out infinite' }} />
            RUNNING
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>polling 5s</span>
        </div>

        <SegmentedProgress
          title="build #1285"
          subtitle="in flight"
          summary="29 / 48"
          segments={[
            { label: 'diffed',    count: 11, color: 'var(--diff-add)' },
            { label: 'capturing', count: 7,  color: 'var(--status-pending)' },
            { label: 'diffing',   count: 11, color: 'var(--accent-primary)' },
            { label: 'queued',    count: 19, color: 'var(--border-default)' },
          ]}
          height={8}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'queued',    n: 6,  c: 'var(--status-stale)' },
            { label: 'capturing', n: 7,  c: 'var(--status-pending)' },
            { label: 'diffing',   n: 11, c: 'var(--accent-primary)' },
            { label: 'completed', n: 0,  c: 'var(--diff-add)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 4, padding: 10,
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)', marginBottom: 8 }}>snapshots</div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            {[
              { n: 'cart-empty',                v: '1280×800', s: 'diffed',     d: 0.42 },
              { n: 'cart-empty.mobile',         v: '375×812',  s: 'diffed',     d: 0.00 },
              { n: 'cart-with-items',           v: '1280×800', s: 'diffing'             },
              { n: 'checkout-step-1-address',   v: '1280×800', s: 'capturing'           },
              { n: 'checkout-step-2-payment',   v: '1280×800', s: 'queued'              },
            ].map((s, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 8,
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontSize: 11,
                opacity: s.s === 'queued' ? 0.55 : 1,
              }}>
                <span style={{
                  color: s.s === 'diffed' ? 'var(--diff-add)' : s.s === 'queued' ? 'var(--fg-muted)' : 'var(--status-pending)',
                  animation: ['diffing', 'capturing'].includes(s.s) ? 'ovrShimmer 1.4s ease-in-out infinite' : 'none',
                }}>{s.s === 'diffed' ? '○' : s.s === 'queued' ? '◌' : '◐'}</span>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.n}</div>
                <span style={{ color: 'var(--fg-tertiary)', fontSize: 10 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}

function MBuildErrorScreen() {
  return (
    <MobileAppShell
      title="#1280"
      subtitle="pr/479 · wip: payment retry"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      trailing={<Button variant="ghost" size="sm" icon="rotateCcw" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
    >
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone="fail">ERROR</Badge>
          <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>0.4s · 5h ago</span>
        </div>
        <Alert tone="destructive" title="capture pipeline error" dismissable={false}>
          <div style={{ marginTop: 4 }}>
            baseline viewport mismatch. expected 1280×800, got 1280×720. job exhausted after 5 attempts.
          </div>
        </Alert>
        <CodeBlock
          label="stacktrace"
          filename="worker.ts"
          maxHeight={200}
          lines={[
            { text: "TypeError: viewport mismatch", tone: 'error' },
            { text: "   at setViewportSize  worker.ts:142" },
            { text: "   at captureSnapshot  snapshots.ts:48" },
            { text: "   at Worker.processJob" },
            { text: "expected 1280×800", tone: 'dim' },
            { text: "got      1280×720", tone: 'dim' },
          ]}
        />
        <Button variant="secondary" size="md" icon="rotateCcw" style={{ width: '100%', justifyContent: 'center' }}>rerun build</Button>
      </div>
    </MobileAppShell>
  );
}

// ===========================================================================
// DIFF — tab-switched on mobile (baseline / current / overlay)
// ===========================================================================
function MDiffScreen() {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const snapshot = SNAPSHOTS_BY_RUN[run.id].find((s) => s.mock === 'checkoutPage');
  const mock = MOCKS[snapshot.mock];
  return (
    <MobileAppShell
      title={snapshot.name}
      subtitle={`${snapshot.viewport} · Δ ${snapshot.deltaPct.toFixed(2)}%`}
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      bottomBar={
        <MobileActionBar>
          <Button variant="destructive" size="md" icon="x" style={{ flex: 1, justifyContent: 'center' }}>reject</Button>
          <Button variant="primary" size="md" icon="check" style={{ flex: 1, justifyContent: 'center' }}>approve</Button>
        </MobileActionBar>
      }
    >
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
        {['baseline', 'current', 'overlay', 'slider'].map((t, i) => (
          <button key={t} style={{
            flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
            borderBottom: i === 1 ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: i === 1 ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>
      <div style={{
        padding: 12,
        background: 'var(--bg-inset)',
        backgroundImage: 'var(--pixel-grid)',
        backgroundSize: 'var(--pixel-grid-size)',
        minHeight: 'calc(100% - 50px)',
      }}>
        <div style={{ width: 351, height: 351 * (MOCK_H / MOCK_W), background: '#fff', border: '1px solid var(--border-default)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${351 / MOCK_W})`, transformOrigin: 'top left' }}>
            <mock.Component variant="current" />
          </div>
          {/* synthetic diff hotspot */}
          <div style={{ position: 'absolute', top: '32%', left: '8%', right: '8%', height: 12, background: 'var(--diff-change-dim)', border: '1px solid var(--diff-change)', borderRadius: 1 }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 11, color: 'var(--fg-secondary)' }}>
          <Glyph kind="changed" /> 1 changed region · 1.84% pixels
        </div>
      </div>
    </MobileAppShell>
  );
}

function MDiffNoBaselineScreen() {
  return (
    <MobileAppShell
      title="new-promo-banner"
      subtitle="1280×800 · new story"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      bottomBar={
        <MobileActionBar>
          <Button variant="destructive" size="md" icon="x" style={{ flex: 1, justifyContent: 'center' }}>reject</Button>
          <Button variant="primary" size="md" icon="check" style={{ flex: 1, justifyContent: 'center' }}>approve as baseline</Button>
        </MobileActionBar>
      }
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Alert tone="accent" title="first-run · no baseline yet" dismissable={false}>
          approving on the default branch sets this snapshot as the baseline for future comparisons.
        </Alert>
        <div style={{
          width: '100%', aspectRatio: `${MOCK_W} / ${MOCK_H}`,
          background: '#fff', border: '1px solid var(--border-default)', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${351 / MOCK_W})`, transformOrigin: 'top left' }}>
            <MOCKS.checkoutPage.Component variant="current" />
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}

function MDiffRenderErrorScreen() {
  return (
    <MobileAppShell
      title="cart-with-broken-promo"
      subtitle="1280×800 · render error"
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      bottomBar={
        <MobileActionBar>
          <Button variant="destructive" size="md" icon="x" style={{ flex: 1, justifyContent: 'center' }}>reject</Button>
          <Button variant="primary" size="md" icon="check" disabled style={{ flex: 1, justifyContent: 'center' }}>approve</Button>
        </MobileActionBar>
      }
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Alert tone="destructive" title="2 console errors captured" dismissable={false}>
          review logs before approving.
        </Alert>
        <div style={{
          width: '100%', aspectRatio: `${MOCK_W} / ${MOCK_H}`,
          border: '2px solid var(--diff-remove)', background: '#fff', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ width: MOCK_W, height: MOCK_H, transform: `scale(${349 / MOCK_W})`, transformOrigin: 'top left' }}>
            <MOCKS.emptyCart.Component variant="current" />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.68 0.23 25 / 0.18)' }} />
        </div>
        <Logs
          compact
          showFilter={false}
          activeLevel="all"
          maxHeight={180}
          entries={[
            { t: '00:00.142', lv: 'info',  msg: 'navigating to story' },
            { t: '00:00.521', lv: 'info',  msg: 'story rendered' },
            { t: '00:00.701', lv: 'error', msg: "TypeError: Cannot read 'discount' of undefined" },
            { t: '00:00.701', lv: 'error', msg: '   at PromoBanner (PromoBanner.tsx:42)' },
          ]}
        />
      </div>
    </MobileAppShell>
  );
}

// ===========================================================================
// USERS & SETTINGS
// ===========================================================================
function MSettingsIndexScreen() {
  const sections = [
    { group: 'account', items: [
      { icon: 'monitor', label: 'profile', sub: 'ari shapiro · ari@acme.dev' },
      { icon: 'command', label: 'api keys', sub: '4 keys · 1 unused' },
      { icon: 'eye',     label: 'sessions', sub: '2 active devices' },
    ]},
    { group: 'admin', items: [
      { icon: 'monitor', label: 'users',         sub: '6 members' },
      { icon: 'plus',    label: 'invitations',   sub: '3 pending · 1 expiring' },
      { icon: 'settings',label: 'instance',      sub: 'self-hosted · v0.4.2' },
    ]},
  ];
  return (
    <MobileAppShell
      title="settings"
      bottomBar={<MobileTabBar active="settings" />}
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map((sec) => (
          <div key={sec.group}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)', padding: '0 4px 8px' }}>{sec.group}</div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 4, overflow: 'hidden' }}>
              {sec.items.map((it, i) => (
                <a key={it.label} href="#" onClick={(e) => e.preventDefault()} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderBottom: i < sec.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  textDecoration: 'none', color: 'inherit',
                }}>
                  <Icon name={it.icon} size={14} style={{ color: 'var(--fg-tertiary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--fg-primary)' }}>{it.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.sub}</div>
                  </div>
                  <Icon name="chevronRight" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}

function MUsersScreen({ withInviteUrl }) {
  const users = [
    { name: 'ari shapiro',   email: 'ari@acme.dev',   role: 'admin', last: '2m', self: true  },
    { name: 'jules ortega',  email: 'jules@acme.dev', role: 'admin', last: '8m' },
    { name: 'sam chen',      email: 'sam@acme.dev',   role: 'user',  last: '1h' },
    { name: 'mo abrahams',   email: 'mo@acme.dev',    role: 'user',  last: '3h' },
    { name: 'rena park',     email: 'rena@acme.dev',  role: 'user',  last: '2d' },
    { name: 'theo nakamura', email: 'theo@acme.dev',  role: 'user',  last: '14d', deactivated: true },
  ];
  return (
    <MobileAppShell
      title="users"
      subtitle={`${users.length} members`}
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      trailing={<Button variant="primary" size="sm" icon="plus" style={{ height: 32 }} />}
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {withInviteUrl && (
          <Alert tone="success" title="invitation created · expires 48h">
            <div style={{
              marginTop: 6, padding: '6px 8px',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              borderRadius: 2,
              fontSize: 10, color: 'var(--fg-primary)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://ovr.acme.dev/invite/inv_8f3a91b6c0d4</span>
              <Button variant="ghost" size="sm" icon="externalLink" />
            </div>
          </Alert>
        )}

        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)', marginTop: 4 }}>pending invitations (3)</div>
        {[
          { email: 'kira@acme.dev', by: 'ari',   exp: 'in 44h' },
          { email: 'lena@acme.dev', by: 'jules', exp: 'in 23h' },
          { email: 'park@acme.dev', by: 'ari',   exp: 'in 0h',  expiring: true },
        ].map((inv) => (
          <div key={inv.email} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 10,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
          }}>
            <Icon name="plus" size={12} style={{ color: 'var(--fg-tertiary)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
              <div style={{ fontSize: 10, color: inv.expiring ? 'var(--status-stale)' : 'var(--fg-tertiary)' }}>
                {inv.expiring && <Glyph kind="stale" size={9} style={{ marginRight: 3 }} />}
                by {inv.by} · {inv.exp}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon="externalLink" />
          </div>
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)', marginTop: 4 }}>members ({users.length})</div>
        {users.map((u) => (
          <div key={u.email} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 10,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            opacity: u.deactivated ? 0.55 : 1,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 2,
              background: 'var(--bg-inset)', border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)', flexShrink: 0,
            }}>{u.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                {u.self && <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>you</span>}
                {u.deactivated && <Badge tone="fail">off</Badge>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
            {u.role === 'admin' ? <Badge tone="accent">admin</Badge> : <Badge tone="neutral">user</Badge>}
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}

function MInviteSheet() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MUsersScreen />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        borderRadius: '8px 8px 0 0',
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border-default)', borderRadius: 2, margin: '0 auto -6px' }} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em' }}>invite user</h2>
          <Button variant="ghost" size="sm" icon="x" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
          generates a single-use invitation token. share the URL by any channel — no email is sent.
        </div>
        <Field label="email" value="kira@acme.dev" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>role</span>
          <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden' }}>
            <button style={{ flex: 1, height: 36, background: 'var(--bg-active)', border: 'none', color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12 }}>user</button>
            <button style={{ flex: 1, height: 36, background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-default)', color: 'var(--fg-tertiary)', fontFamily: 'inherit', fontSize: 12 }}>admin</button>
          </div>
        </div>
        <Button variant="primary" size="lg" icon="plus" style={{ width: '100%', justifyContent: 'center' }}>create invitation</Button>
      </div>
    </div>
  );
}

function MApiKeysScreen({ withReveal }) {
  const keys = [
    { name: 'ci · github actions', created: '2026-04-14', lastUsed: '2m ago' },
    { name: 'local dev',            created: '2026-04-22', lastUsed: '4h ago' },
    { name: 'staging deploy',       created: '2026-05-02', lastUsed: '3d ago' },
    { name: 'experiment · phoenix', created: '2026-03-30', lastUsed: 'never', stale: true },
  ];
  return (
    <MobileAppShell
      title="api keys"
      subtitle={`${keys.length} keys`}
      leading={<Button variant="ghost" size="sm" icon="chevronLeft" style={{ width: 36, height: 36, justifyContent: 'center' }} />}
      trailing={<Button variant="primary" size="sm" icon="plus" style={{ height: 32 }} />}
    >
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {withReveal && (
          <Alert tone="accent" title="copy this key now · shown once">
            <div style={{
              marginTop: 6, padding: '8px 10px',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              borderRadius: 2,
              fontSize: 10, color: 'var(--fg-primary)',
              wordBreak: 'break-all',
            }}>ovr_pk_live_9f2a8e6c4b1d0a3f5e7c9b2d4a6f8e0c</div>
            <Button variant="secondary" size="sm" icon="externalLink" style={{ marginTop: 6 }}>copy</Button>
          </Alert>
        )}
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', padding: '0 4px', lineHeight: 1.5 }}>
          the secret is shown <span style={{ color: 'var(--accent-primary)' }}>exactly once</span> at creation. only the name and last-used timestamp are stored.
        </div>
        {keys.map((k) => (
          <div key={k.name} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
          }}>
            <Icon name="command" size={14} style={{ color: 'var(--fg-tertiary)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-primary)' }}>{k.name}</div>
              <div style={{ fontSize: 10, color: k.stale ? 'var(--status-stale)' : 'var(--fg-tertiary)' }}>
                {k.stale && <Glyph kind="stale" size={9} style={{ marginRight: 3 }} />}
                created {k.created} · last used {k.lastUsed}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon="x" />
          </div>
        ))}

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>cli usage</span>
          <Command>ovr snapshot --api-key $OVR_API_KEY</Command>
        </div>
      </div>
    </MobileAppShell>
  );
}

Object.assign(window, {
  MSetupScreen, MLoginScreen, MInviteScreen,
  MProjectsScreen, MProjectsEmptyScreen, MNewProjectScreen, MProjectSettingsScreen, MDeleteProjectScreen,
  MRunsScreen, MRunDetailScreen, MPendingBuildScreen, MBuildErrorScreen,
  MDiffScreen, MDiffNoBaselineScreen, MDiffRenderErrorScreen,
  MSettingsIndexScreen, MUsersScreen, MInviteSheet, MApiKeysScreen,
});
