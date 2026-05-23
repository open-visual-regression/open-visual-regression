/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, DCPostIt,
   ProjectsScreen, RunsScreen, RunDetailScreen, DiffScreen,
   SetupScreen, LoginScreen, InviteScreen,
   UsersScreen, InviteModalScreen, ApiKeysScreen, AppShell,
   NewProjectScreen, ProjectSettingsScreen, DeleteProjectScreen,
   PendingBuildScreen, BuildErrorScreen, DiffNoBaselineScreen, DiffRenderErrorScreen,
   PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN */

// ============================================================================
// OVR — pages reference. Every screen the spec calls for, on one canvas.
// Sections follow the rough lifecycle of the product.
// ============================================================================

// ---------------------------------------------------------------------------
// Wrappers that hand each existing screen its mocked context so they all
// render standalone inside an artboard.
// ---------------------------------------------------------------------------
function noop() {}

function ProjectsArtboard()   { return <AppShell breadcrumb={{ project: null, view: 'projects' }}><ProjectsScreen onNavigate={noop} /></AppShell>; }

function ProjectsEmptyArtboard() {
  return (
    <AppShell breadcrumb={{ project: null, view: 'projects' }}>
      <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, color: 'var(--fg-primary)' }}>projects</h1>
          <span style={{ marginLeft: 12, fontSize: 14, color: 'var(--fg-tertiary)' }}>(0)</span>
          <div style={{ marginLeft: 'auto' }}>
            <button style={{
              height: 32, padding: '0 14px',
              background: 'var(--accent-primary)', color: 'var(--fg-on-accent)',
              border: 'none', borderRadius: 2,
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>+ new project</button>
          </div>
        </div>
        <div style={{
          height: 360,
          border: '1px dashed var(--border-default)',
          borderRadius: 4,
          background: 'var(--bg-base)',
          backgroundImage: 'var(--pixel-grid)',
          backgroundSize: 'var(--pixel-grid-size)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 2,
            border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-tertiary)', fontSize: 18,
          }}>∅</div>
          <div style={{ fontSize: 14, color: 'var(--fg-primary)' }}>no projects yet.</div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', maxWidth: 360, lineHeight: 1.6 }}>
            create a project to start receiving builds from the CLI. you&apos;ll need at least one variant (browser + viewport) before the first build can be accepted.
          </div>
          <button style={{
            marginTop: 6,
            height: 32, padding: '0 14px',
            background: 'var(--accent-primary)', color: 'var(--fg-on-accent)',
            border: 'none', borderRadius: 2,
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>create first project</button>
        </div>
      </div>
    </AppShell>
  );
}

function RunsArtboard() {
  const project = PROJECTS[0];
  return (
    <AppShell breadcrumb={{ project, view: 'runs' }} activeProjectId={project.id}>
      <RunsScreen project={project} onNavigate={noop} />
    </AppShell>
  );
}

function RunDetailArtboard() {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0]; // #1284 changed
  return (
    <AppShell breadcrumb={{ project, run: { id: run.id }, view: 'run' }} activeProjectId={project.id}>
      <RunDetailScreen project={project} run={run} onNavigate={noop} />
    </AppShell>
  );
}

function DiffArtboard() {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const snapshot = SNAPSHOTS_BY_RUN[run.id].find((s) => s.mock === 'checkoutPage');
  return (
    <AppShell breadcrumb={{ project, run: { id: run.id }, view: 'diff' }} activeProjectId={project.id}>
      <DiffScreen project={project} run={run} snapshot={snapshot} onNavigate={noop} />
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Canvas composition
// ---------------------------------------------------------------------------
const APP_W = 1280, APP_H = 800;
const AUTH_W = 720, AUTH_H = 720;

function App() {
  return (
    <DesignCanvas>
      {/* =====================================================================
          1 · ONBOARDING & AUTH
          ===================================================================== */}
      <DCSection id="auth" title="onboarding & auth" subtitle="first-run setup → login → invite-only registration. dark, centered cards. no public signup.">
        <DCArtboard id="setup" label="/setup · first-run wizard" width={AUTH_W} height={AUTH_H}>
          <SetupScreen />
        </DCArtboard>
        <DCArtboard id="login" label="/login · default" width={AUTH_W} height={AUTH_H}>
          <LoginScreen />
        </DCArtboard>
        <DCArtboard id="login-error" label="/login · invalid credentials" width={AUTH_W} height={AUTH_H}>
          <LoginScreen error />
        </DCArtboard>
        <DCArtboard id="invite-valid" label="/invite/[id] · valid token" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="valid" />
        </DCArtboard>
        <DCArtboard id="invite-expired" label="/invite/[id] · expired" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="expired" />
        </DCArtboard>
        <DCArtboard id="invite-used" label="/invite/[id] · already used" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="used" />
        </DCArtboard>
      </DCSection>

      {/* =====================================================================
          2 · PROJECTS
          ===================================================================== */}
      <DCSection id="projects" title="projects" subtitle="list / create / configure. variants (browser × viewport) are required before a project accepts builds.">
        <DCArtboard id="projects-list" label="/projects · list" width={APP_W} height={APP_H}>
          <ProjectsArtboard />
        </DCArtboard>
        <DCArtboard id="projects-empty" label="/projects · empty instance" width={APP_W} height={APP_H}>
          <ProjectsEmptyArtboard />
        </DCArtboard>
        <DCArtboard id="projects-new" label="/projects/new" width={APP_W} height={APP_H}>
          <NewProjectScreen />
        </DCArtboard>
        <DCArtboard id="projects-new-conflict" label="/projects/new · slug conflict" width={APP_W} height={APP_H}>
          <NewProjectScreen slugTaken />
        </DCArtboard>
        <DCArtboard id="project-settings" label="/projects/[slug]/settings · variants" width={APP_W} height={APP_H}>
          <ProjectSettingsScreen />
        </DCArtboard>
        <DCArtboard id="project-add-variant" label="/projects/[slug]/settings · add variant row" width={APP_W} height={APP_H}>
          <ProjectSettingsScreen showAddVariant />
        </DCArtboard>
        <DCArtboard id="project-delete" label="/projects/[slug]/settings · delete confirm" width={APP_W} height={APP_H}>
          <DeleteProjectScreen />
        </DCArtboard>
      </DCSection>

      {/* =====================================================================
          3 · BUILDS · LIST + DETAIL
          ===================================================================== */}
      <DCSection id="builds" title="builds (runs)" subtitle="list of builds for a project · build detail with snapshot grid · live polling while running.">
        <DCArtboard id="runs-list" label="/projects/[slug]/builds · list" width={APP_W} height={APP_H}>
          <RunsArtboard />
        </DCArtboard>
        <DCArtboard id="run-detail" label="/projects/[slug]/builds/[id] · snapshot grid" width={APP_W} height={APP_H}>
          <RunDetailArtboard />
        </DCArtboard>
        <DCArtboard id="run-pending" label="/projects/[slug]/builds/[id] · pending (polling)" width={APP_W} height={APP_H}>
          <PendingBuildScreen />
        </DCArtboard>
        <DCArtboard id="run-error" label="/projects/[slug]/builds/[id] · error (retries exhausted)" width={APP_W} height={APP_H}>
          <BuildErrorScreen />
        </DCArtboard>
      </DCSection>

      {/* =====================================================================
          4 · DIFF VIEWER
          ===================================================================== */}
      <DCSection id="diff" title="diff viewer" subtitle="side-by-side / overlay / slider modes. plus the two special-case views: no baseline, and render error.">
        <DCArtboard id="diff-side" label="diff · side-by-side · approve/reject" width={APP_W} height={APP_H}>
          <DiffArtboard />
        </DCArtboard>
        <DCArtboard id="diff-no-baseline" label="diff · no baseline (new story)" width={APP_W} height={APP_H}>
          <DiffNoBaselineScreen />
        </DCArtboard>
        <DCArtboard id="diff-render-error" label="diff · render error + logs panel" width={APP_W} height={APP_H}>
          <DiffRenderErrorScreen />
        </DCArtboard>
      </DCSection>

      {/* =====================================================================
          5 · USERS & SETTINGS
          ===================================================================== */}
      <DCSection id="settings" title="users & settings" subtitle="admin user management, invitations, and personal API keys for the CLI.">
        <DCArtboard id="users" label="/admin/users · list" width={APP_W} height={APP_H}>
          <UsersScreen />
        </DCArtboard>
        <DCArtboard id="users-with-url" label="/admin/users · just-created invite URL banner" width={APP_W} height={APP_H}>
          <UsersScreen withInviteUrl />
        </DCArtboard>
        <DCArtboard id="users-invite-modal" label="/admin/users · invite modal" width={APP_W} height={APP_H}>
          <InviteModalScreen />
        </DCArtboard>
        <DCArtboard id="apikeys" label="/settings/api-keys · list" width={APP_W} height={APP_H}>
          <ApiKeysScreen />
        </DCArtboard>
        <DCArtboard id="apikeys-reveal" label="/settings/api-keys · reveal-once after create" width={APP_W} height={APP_H}>
          <ApiKeysScreen withReveal />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
