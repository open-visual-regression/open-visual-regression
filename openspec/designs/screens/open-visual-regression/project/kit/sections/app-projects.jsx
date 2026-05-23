/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, AppShell,
   ProjectsScreen, NewProjectScreen, ProjectSettingsScreen, DeleteProjectScreen,
   PROJECTS */

const APP_W = 1280, APP_H = 800;
function noop() {}

function ProjectsArtboard() {
  return <AppShell breadcrumb={{ project: null, view: 'projects' }}><ProjectsScreen onNavigate={noop} /></AppShell>;
}

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
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', maxWidth: 360, lineHeight: 1.6 }}>
            create a project to start receiving builds from the CLI. you&apos;ll need at least one variant (browser + viewport) before the first build can be accepted.
          </div>
          <button style={{
            marginTop: 6,
            height: 32, padding: '0 14px',
            background: 'var(--accent-primary)', color: 'var(--fg-on-accent)',
            border: 'none', borderRadius: 2,
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>create first project</button>
        </div>
      </div>
    </AppShell>
  );
}

function App() {
  return (
    <DesignCanvas>
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
        <DCArtboard id="project-settings-saved" label="/projects/[slug]/settings · saved toast" width={APP_W} height={APP_H}>
          <ProjectSettingsScreen withSavedToast />
        </DCArtboard>
        <DCArtboard id="project-add-variant" label="/projects/[slug]/settings · add variant row" width={APP_W} height={APP_H}>
          <ProjectSettingsScreen showAddVariant />
        </DCArtboard>
        <DCArtboard id="project-delete" label="/projects/[slug]/settings · delete confirm" width={APP_W} height={APP_H}>
          <DeleteProjectScreen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
