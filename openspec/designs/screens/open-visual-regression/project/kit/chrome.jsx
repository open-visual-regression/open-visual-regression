/* global React, Icon, Button, Badge, Glyph, KeyHint, OvrMark, DiffStrip */
// OVR — chrome: TopBar, Sidebar

function TopBar({ project, run, view, onNavigate }) {
  return (
    <div style={{
      height: 'var(--topbar-h)', flexShrink: 0,
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 16,
    }}>
      {/* logo */}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onNavigate({ view: 'projects' }); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--fg-primary)', textDecoration: 'none' }}
      >
        <OvrMark size={22} />
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em' }}>ovr</span>
      </a>

      <div style={{ width: 1, height: 20, background: 'var(--border-default)' }} />

      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, whiteSpace: 'nowrap' }}>
        {project ? (
          <>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate({ view: 'runs', projectId: project.id }); }}
              style={{ color: 'var(--fg-primary)' }}
            >{project.name}</a>
            {run && (
              <>
                <Icon name="chevronRight" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate({ view: 'run', projectId: project.id, runId: run.id }); }}
                  style={{ color: 'var(--fg-primary)' }}
                >#{run.id}</a>
              </>
            )}
            {view === 'diff' && (
              <>
                <Icon name="chevronRight" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                <span style={{ color: 'var(--fg-tertiary)' }}>diff</span>
              </>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--fg-tertiary)' }}>projects</span>
        )}
      </div>

      {/* search */}
      <div style={{
        marginLeft: 'auto', width: 280, height: 28,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 2, color: 'var(--fg-tertiary)',
      }}>
        <Icon name="search" size={12} />
        <span style={{ fontSize: 11, flex: 1 }}>search runs, snapshots…</span>
        <KeyHint>⌘K</KeyHint>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Button variant="ghost" size="sm" icon="gitBranch">main</Button>
        <Button variant="ghost" size="sm" icon="settings" />
        <div style={{
          width: 24, height: 24, borderRadius: 2,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)',
        }}>am</div>
      </div>
    </div>
  );
}

function Sidebar({ projects, activeProjectId, recentRuns, onNavigate }) {
  return (
    <div style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      borderRight: '1px solid var(--border-default)',
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 12px 6px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-tertiary)',
        }}>projects</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-muted)' }}>{projects.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {projects.map((p) => {
          const active = p.id === activeProjectId;
          return (
            <a
              key={p.id} href="#"
              onClick={(e) => { e.preventDefault(); onNavigate({ view: 'runs', projectId: p.id }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 28, padding: '0 12px',
                fontSize: 12,
                color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                background: active ? 'var(--bg-active)' : 'transparent',
                textDecoration: 'none',
                borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingLeft: 10,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name="folder" size={12} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{p.name}</span>
              {p.changedCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 10, color: 'var(--accent-primary)', fontWeight: 600,
                }}>{p.changedCount}</span>
              )}
            </a>
          );
        })}
      </div>

      <div style={{ padding: '14px 12px 6px', marginTop: 8, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-tertiary)',
        }}>recent runs</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {recentRuns.map((r) => (
          <a
            key={r.id} href="#"
            onClick={(e) => { e.preventDefault(); onNavigate({ view: 'run', projectId: r.projectId, runId: r.id }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 28, padding: '0 12px',
              fontSize: 11,
              color: 'var(--fg-secondary)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Glyph kind={r.status === 'changed' ? 'changed' : r.status === 'pending' ? 'pending' : 'passed'} size={12} />
            <span style={{ color: 'var(--fg-tertiary)' }}>#{r.id}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.projectName}</span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="collapse"
          style={{
            width: 24, height: 24, padding: 0,
            background: 'transparent',
            color: 'var(--fg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--fg-muted)' }}>
          <span>ovr</span>
          <span>v0.4.2</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-muted)' }}>self-hosted</span>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, Sidebar });
