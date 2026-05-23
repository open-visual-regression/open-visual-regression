/* global React, Icon, Button, Badge, Glyph, OvrMark, PROJECTS, RECENT_RUNS */
// OVR — mobile chrome. 375×812 design viewport.
// TopBar with hamburger, drawer overlay sidebar, bottom safe-area.

const MOBILE_TOPBAR_H = 48;
const MOBILE_TABBAR_H = 56;

// ---------------------------------------------------------------------------
// MobileTopBar — hamburger + title + right-side action
// ---------------------------------------------------------------------------
function MobileTopBar({ title, subtitle, onMenu, leading, trailing }) {
  return (
    <div style={{
      height: MOBILE_TOPBAR_H, flexShrink: 0,
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center',
      padding: '0 8px', gap: 8,
    }}>
      {leading ?? (
        <button onClick={onMenu} style={{
          width: 36, height: 36, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--fg-primary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-label="menu">
          <Icon name="menu" size={16} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileDrawer — slides over content. Static "open" state for design.
// ---------------------------------------------------------------------------
function MobileDrawer({ open = false, activeProjectId }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: 280,
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          height: MOBILE_TOPBAR_H, flexShrink: 0,
          padding: '0 12px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <OvrMark size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>ovr</span>
          <span style={{ fontSize: 10, color: 'var(--fg-tertiary)', marginLeft: 'auto' }}>v0.4.2</span>
        </div>

        <div style={{ overflow: 'auto', flex: 1, paddingBottom: 16 }}>
          <div style={{ padding: '14px 12px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>projects</span>
          </div>
          {PROJECTS.map((p) => {
            const active = p.id === activeProjectId;
            return (
              <a key={p.id} href="#" onClick={(e) => e.preventDefault()} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 40, paddingLeft: 12, paddingRight: 12,
                fontSize: 13,
                color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                background: active ? 'var(--bg-active)' : 'transparent',
                textDecoration: 'none',
                borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingLeft: 10,
              }}>
                <Icon name="folder" size={13} style={{ color: 'var(--fg-tertiary)' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {p.changedCount > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>{p.changedCount}</span>
                )}
              </a>
            );
          })}

          <div style={{ padding: '14px 12px 6px', marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>account</span>
          </div>
          {[
            { icon: 'monitor', label: 'profile' },
            { icon: 'command', label: 'api keys' },
            { icon: 'settings', label: 'settings' },
            { icon: 'x', label: 'sign out' },
          ].map((it) => (
            <a key={it.label} href="#" onClick={(e) => e.preventDefault()} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              height: 40, padding: '0 12px',
              fontSize: 13, color: 'var(--fg-secondary)', textDecoration: 'none',
            }}>
              <Icon name={it.icon} size={13} style={{ color: 'var(--fg-tertiary)' }} />
              <span>{it.label}</span>
            </a>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 2,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)',
          }}>ar</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-primary)' }}>ari shapiro</div>
            <div style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>admin · acme</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileAppShell — TopBar + content + optional bottom tab bar
// ---------------------------------------------------------------------------
function MobileAppShell({ title, subtitle, leading, trailing, drawer, bottomBar, toast, children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <MobileTopBar title={title} subtitle={subtitle} leading={leading} trailing={trailing} />
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {children}
      </div>
      {toast && (
        <div style={{
          flexShrink: 0,
          padding: '8px 12px',
          background: 'transparent',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {React.Children.map(toast, (c, i) => <div key={i}>{c}</div>)}
        </div>
      )}
      {bottomBar}
      {drawer}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileTabBar — bottom navigation for main sections
// ---------------------------------------------------------------------------
function MobileTabBar({ active }) {
  const tabs = [
    { id: 'projects', icon: 'folder',  label: 'projects' },
    { id: 'runs',     icon: 'gitCommit', label: 'runs' },
    { id: 'settings', icon: 'settings', label: 'settings' },
  ];
  return (
    <div style={{
      height: MOBILE_TABBAR_H, flexShrink: 0,
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
    }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button key={t.id} style={{
            flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: 0,
            color: isActive ? 'var(--accent-primary)' : 'var(--fg-tertiary)',
            fontFamily: 'inherit',
          }}>
            <Icon name={t.icon} size={16} />
            <span style={{ fontSize: 10, letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileBottomSheet — sticky bottom action bar (for diff approve/reject etc.)
// ---------------------------------------------------------------------------
function MobileActionBar({ children }) {
  return (
    <div style={{
      flexShrink: 0,
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-default)',
      padding: 8,
      display: 'flex', gap: 8,
    }}>
      {children}
    </div>
  );
}

Object.assign(window, { MobileTopBar, MobileDrawer, MobileAppShell, MobileTabBar, MobileActionBar, MOBILE_TOPBAR_H, MOBILE_TABBAR_H });
