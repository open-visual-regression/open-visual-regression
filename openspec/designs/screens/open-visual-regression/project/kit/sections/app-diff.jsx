/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, AppShell,
   DiffScreen, DiffNoBaselineScreen, DiffRenderErrorScreen,
   PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN */

const APP_W = 1280, APP_H = 800;
function noop() {}

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

function App() {
  return (
    <DesignCanvas>
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
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
