/* global React, ReactDOM, TopBar, Sidebar, ProjectsScreen, RunsScreen, RunDetailScreen, DiffScreen, PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN, RECENT_RUNS */
// OVR — root app: route state + screen dispatch.

const { useState, useCallback } = React;

function App() {
  // route shape: { view: 'projects'|'runs'|'run'|'diff', projectId?, runId?, snapshotId? }
  const [route, setRoute] = useState({ view: 'projects' });

  const navigate = useCallback((next) => setRoute(next), []);

  // Resolve current entities
  const project  = route.projectId  ? PROJECTS.find((p) => p.id === route.projectId) : null;
  const run      = (project && route.runId)
    ? (RUNS_BY_PROJECT[project.id] || []).find((r) => r.id === route.runId)
    : null;
  const snapshot = (run && route.snapshotId)
    ? (SNAPSHOTS_BY_RUN[run.id] || []).find((s) => s.id === route.snapshotId)
    : null;

  return (
    <div data-theme="dark" style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)', color: 'var(--fg-primary)',
      fontFamily: 'var(--font-mono)',
      overflow: 'hidden',
    }}>
      <TopBar
        project={project}
        run={run}
        view={route.view}
        onNavigate={navigate}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar
          projects={PROJECTS}
          activeProjectId={project ? project.id : null}
          recentRuns={RECENT_RUNS}
          onNavigate={navigate}
        />
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          overflow: route.view === 'diff' ? 'hidden' : 'auto',
        }}>
          {route.view === 'projects' && (
            <ProjectsScreen onNavigate={navigate} />
          )}
          {route.view === 'runs' && project && (
            <RunsScreen project={project} onNavigate={navigate} />
          )}
          {route.view === 'run' && project && run && (
            <RunDetailScreen project={project} run={run} onNavigate={navigate} />
          )}
          {route.view === 'diff' && project && run && snapshot && (
            <DiffScreen project={project} run={run} snapshot={snapshot} onNavigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
