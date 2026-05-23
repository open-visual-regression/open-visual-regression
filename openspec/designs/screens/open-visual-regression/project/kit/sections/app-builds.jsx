/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, AppShell, Toast,
   RunsScreen, RunDetailScreen, PendingBuildScreen, BuildErrorScreen,
   PROJECTS, RUNS_BY_PROJECT */

const APP_W = 1280, APP_H = 800;
function noop() {}

function RunsArtboard() {
  const project = PROJECTS[0];
  return (
    <AppShell breadcrumb={{ project, view: 'runs' }} activeProjectId={project.id}>
      <RunsScreen project={project} onNavigate={noop} />
    </AppShell>
  );
}

function RunDetailArtboard({ withToast }) {
  const project = PROJECTS[0];
  const run = RUNS_BY_PROJECT[project.id][0];
  const changedCount = (RUNS_BY_PROJECT[project.id][0].changed) || 5;
  return (
    <AppShell
      breadcrumb={{ project, run: { id: run.id }, view: 'run' }}
      activeProjectId={project.id}
      toast={withToast && (
        <>
          <Toast tone="success" title={`run #${run.id} approved`} action={{ label: 'view' }}>
            {changedCount} snapshots accepted · baseline updated
          </Toast>
          <Toast tone="accent" title="new run starting">
            #{Number(run.id) + 1} · pr/484 · 12 snapshots queued
          </Toast>
        </>
      )}
    >
      <RunDetailScreen project={project} run={run} onNavigate={noop} />
    </AppShell>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="builds" title="builds (runs)" subtitle="list of builds for a project · build detail with snapshot grid · live polling while running.">
        <DCArtboard id="runs-list" label="/projects/[slug]/builds · list" width={APP_W} height={APP_H}>
          <RunsArtboard />
        </DCArtboard>
        <DCArtboard id="run-detail" label="/projects/[slug]/builds/[id] · snapshot grid" width={APP_W} height={APP_H}>
          <RunDetailArtboard />
        </DCArtboard>
        <DCArtboard id="run-detail-toast" label="build detail · approve success toast" width={APP_W} height={APP_H}>
          <RunDetailArtboard withToast />
        </DCArtboard>
        <DCArtboard id="run-pending" label="/projects/[slug]/builds/[id] · pending (polling)" width={APP_W} height={APP_H}>
          <PendingBuildScreen />
        </DCArtboard>
        <DCArtboard id="run-error" label="/projects/[slug]/builds/[id] · error (retries exhausted)" width={APP_W} height={APP_H}>
          <BuildErrorScreen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
