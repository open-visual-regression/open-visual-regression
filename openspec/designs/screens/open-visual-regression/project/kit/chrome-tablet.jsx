/* global React, Icon, Button, Badge, Glyph, OvrMark, KeyHint, PROJECTS, RECENT_RUNS */
// OVR — tablet chrome. 768×1024 design viewport.
// Collapsed sidebar (48px) matches the design system's canonical pattern:
// 2-letter lowercase monograms, dot indicator for change-count, expand toggle.

const TABLET_SIDEBAR_W = 48;

function TabletSidebar({ activeProjectId }) {
  return (
    <div style={{
      width: TABLET_SIDEBAR_W, flexShrink: 0,
      borderRight: '1px solid var(--border-default)',
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', padding: 0,
    }}>
      {/* projects group label */}
      <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>prj</span>
      </div>

      {/* project rows — full-width with monograms */}
      {PROJECTS.map((p) => {
        const active = p.id === activeProjectId;
        const mono = p.name.split(/[\s-]/).map((w) => w[0]).join('').slice(0, 2).toLowerCase();
        return (
          <a
            key={p.id} href="#"
            title={p.name}
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 32,
              background: active ? 'var(--bg-active)' : 'transparent',
              borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              paddingLeft: 0, paddingRight: 2,
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>{mono}</span>
            {p.changedCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 6, height: 6,
                background: 'var(--accent-primary)',
                borderRadius: '50%',
              }} />
            )}
          </a>
        );
      })}

      {/* runs group label */}
      <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>run</span>
      </div>

      {/* recent runs as glyph stack */}
      {RECENT_RUNS.slice(0, 4).map((r) => {
        const color =
          r.status === 'fail' || r.status === 'failed' ? 'var(--status-fail)'
          : r.status === 'pending' ? 'var(--status-pending)'
          : 'var(--status-pass)';
        const glyph =
          r.status === 'fail' || r.status === 'failed' ? '●'
          : r.status === 'pending' ? '◐'
          : '○';
        return (
          <div key={r.id} title={`#${r.id} · ${r.projectName}`}
            style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color, fontSize: 13 }}>{glyph}</span>
          </div>
        );
      })}

      {/* expand toggle */}
      <div style={{ marginTop: 'auto', padding: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center' }}>
        <button title="expand"
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
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function TabletTopBar({ project, run, view }) {
  return (
    <div style={{
      height: 'var(--topbar-h)', flexShrink: 0,
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 12,
    }}>
      <a href="#" onClick={(e) => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--fg-primary)', textDecoration: 'none' }}>
        <OvrMark size={20} />
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em' }}>ovr</span>
      </a>
      <div style={{ width: 1, height: 18, background: 'var(--border-default)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden' }}>
        {project ? (
          <>
            <a href="#" style={{ color: 'var(--fg-primary)', textDecoration: 'none' }}>{project.name}</a>
            {run && (
              <>
                <Icon name="chevronRight" size={11} style={{ color: 'var(--fg-tertiary)' }} />
                <a href="#" style={{ color: 'var(--fg-primary)', textDecoration: 'none' }}>#{run.id}</a>
              </>
            )}
            {view === 'diff' && (
              <>
                <Icon name="chevronRight" size={11} style={{ color: 'var(--fg-tertiary)' }} />
                <span style={{ color: 'var(--fg-tertiary)' }}>diff</span>
              </>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--fg-tertiary)' }}>projects</span>
        )}
      </div>

      <div style={{
        marginLeft: 'auto', height: 28, width: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 2, color: 'var(--fg-tertiary)',
      }}>
        <Icon name="search" size={12} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Button variant="ghost" size="sm" icon="gitBranch">main</Button>
        <div style={{
          width: 24, height: 24, borderRadius: 2,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)',
        }}>ar</div>
      </div>
    </div>
  );
}

function TabletAppShell({ breadcrumb, activeProjectId, children, toast }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <TabletTopBar {...breadcrumb} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <TabletSidebar activeProjectId={activeProjectId} />
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</div>
      </div>
      {toast && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 60,
          display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
          pointerEvents: 'none',
        }}>
          {React.Children.map(toast, (c, i) => <div key={i} style={{ pointerEvents: 'auto' }}>{c}</div>)}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TabletSidebar, TabletTopBar, TabletAppShell, TABLET_SIDEBAR_W });
