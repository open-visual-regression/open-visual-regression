/* global React, Icon, Button, Badge, Glyph, KeyHint, Field, TopBar, Sidebar, PROJECTS, RECENT_RUNS, Alert, CodeBlock, Command */
// OVR — admin/settings screens: UsersScreen, ApiKeysScreen
// All screens render inside the standard app shell (TopBar + Sidebar + content).

const { useState: useAdminState } = React;

// ---------------------------------------------------------------------------
// AppShell — TopBar + Sidebar + main content, fits an artboard
// ---------------------------------------------------------------------------
function AppShell({ children, breadcrumb, activeProjectId, toast }) {
  // light-touch nav state so the chrome is interactive when clicked
  const [_, setRoute] = useAdminState({ view: 'admin-users' });
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <TopBar
        project={breadcrumb?.project}
        run={breadcrumb?.run}
        view={breadcrumb?.view}
        onNavigate={(r) => setRoute(r)}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar
          projects={PROJECTS}
          activeProjectId={activeProjectId}
          recentRuns={RECENT_RUNS.slice(0, 5)}
          onNavigate={(r) => setRoute(r)}
        />
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {children}
        </div>
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

// ---------------------------------------------------------------------------
// Settings layout: a left rail of sub-nav under the sidebar
// ---------------------------------------------------------------------------
function SettingsLayout({ section, children }) {
  const items = [
    { key: 'profile',  label: 'profile',         icon: 'monitor' },
    { key: 'apikeys',  label: 'api keys',        icon: 'command' },
    { key: 'sessions', label: 'sessions',        icon: 'eye' },
    { key: 'admin',    label: 'ADMIN',           heading: true },
    { key: 'users',    label: 'users',           icon: 'monitor' },
    { key: 'invites',  label: 'invitations',     icon: 'plus' },
    { key: 'instance', label: 'instance',        icon: 'settings' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '20px 0', overflow: 'auto' }}>
        <div style={{ padding: '0 16px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>settings</div>
        {items.map((it) => {
          if (it.heading) {
            return (
              <div key={it.key} style={{ padding: '14px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>{it.label}</div>
            );
          }
          const active = section === it.key;
          return (
            <a key={it.key} href="#" onClick={(e) => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 28, padding: '0 16px',
                paddingLeft: 14,
                borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                fontSize: 12,
                color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                background: active ? 'var(--bg-active)' : 'transparent',
                textDecoration: 'none',
              }}>
              <Icon name={it.icon} size={12} style={{ color: 'var(--fg-tertiary)' }} />
              {it.label}
            </a>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</div>
    </div>
  );
}

// ===========================================================================
// USERS SCREEN — /admin/users
// ===========================================================================
const USERS = [
  { id: 'u1', name: 'ari shapiro',     email: 'ari@acme.dev',     role: 'admin', joined: '2026-04-12', last: '2m ago',   self: true  },
  { id: 'u2', name: 'jules ortega',    email: 'jules@acme.dev',   role: 'admin', joined: '2026-04-12', last: '8m ago' },
  { id: 'u3', name: 'sam chen',        email: 'sam@acme.dev',     role: 'user',  joined: '2026-04-18', last: '1h ago' },
  { id: 'u4', name: 'mo abrahams',     email: 'mo@acme.dev',      role: 'user',  joined: '2026-04-22', last: '3h ago' },
  { id: 'u5', name: 'rena park',       email: 'rena@acme.dev',    role: 'user',  joined: '2026-05-01', last: '2d ago' },
  { id: 'u6', name: 'theo nakamura',   email: 'theo@acme.dev',    role: 'user',  joined: '2026-05-08', last: '14d ago', deactivated: true },
];

const INVITES = [
  { id: 'inv_8f3a', email: 'kira@acme.dev',  invitedBy: 'ari',   issued: '4h ago',  expires: 'in 44h', url: 'https://ovr.acme.dev/invite/inv_8f3a91b' },
  { id: 'inv_b211', email: 'lena@acme.dev',  invitedBy: 'jules', issued: '1d ago',  expires: 'in 23h', url: 'https://ovr.acme.dev/invite/inv_b211a02' },
  { id: 'inv_4cd0', email: 'park@acme.dev',  invitedBy: 'ari',   issued: '2d ago',  expires: 'in 0h',  url: 'https://ovr.acme.dev/invite/inv_4cd0119', expiring: true },
];

function UsersScreen({ withInviteUrl }) {
  return (
    <AppShell breadcrumb={{ project: null, view: 'admin' }}>
      <SettingsLayout section="users">
        <div style={{ padding: '24px 32px', maxWidth: 1080 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>users</h1>
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--fg-tertiary)' }}>({USERS.length})</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="md" icon="filter">all</Button>
              <Button variant="primary" size="md" icon="plus">invite user</Button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 20 }}>
            invitations are single-use, expire after 48h. role enforcement is in the service layer.
          </div>

          {/* invite URL banner (shown right after creating one) */}
          {withInviteUrl && (
            <div style={{ marginBottom: 20 }}>
              <Alert tone="success" title="invitation created · expires in 48h">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 2,
                    fontSize: 11, color: 'var(--fg-primary)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>https://ovr.acme.dev/invite/inv_8f3a91b6c0d4e2f1</span>
                    <Button variant="ghost" size="sm" icon="externalLink">copy</Button>
                  </div>
                  <div style={{ color: 'var(--fg-tertiary)' }}>
                    no email is sent. share this link via your preferred channel. it disappears after you close this banner.
                  </div>
                </div>
              </Alert>
            </div>
          )}

          {/* pending invites */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>pending invitations</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-muted)' }}>({INVITES.length})</span>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              {INVITES.map((inv, i) => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', height: 36, padding: '0 12px', gap: 12,
                  borderBottom: i < INVITES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  fontSize: 12,
                }}>
                  <Icon name="plus" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                  <span style={{ flex: 1, color: 'var(--fg-primary)' }}>{inv.email}</span>
                  <span style={{ width: 120, color: 'var(--fg-tertiary)', fontSize: 11 }}>by {inv.invitedBy} · {inv.issued}</span>
                  <span style={{ width: 80, color: inv.expiring ? 'var(--status-stale)' : 'var(--fg-tertiary)', fontSize: 11, textAlign: 'right' }}>
                    {inv.expiring && <Glyph kind="stale" size={10} style={{ marginRight: 4 }} />}
                    {inv.expires}
                  </span>
                  <Button variant="ghost" size="sm" icon="externalLink">copy</Button>
                  <Button variant="ghost" size="sm" icon="x" title="cancel" />
                </div>
              ))}
            </div>
          </div>

          {/* users */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>members</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-muted)' }}>({USERS.length})</span>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', height: 30, padding: '0 12px', gap: 12,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--fg-tertiary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span style={{ flex: 1 }}>name</span>
                <span style={{ width: 200 }}>email</span>
                <span style={{ width: 60 }}>role</span>
                <span style={{ width: 90 }}>joined</span>
                <span style={{ width: 70 }}>last seen</span>
                <span style={{ width: 32 }} />
              </div>
              {USERS.map((u) => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', gap: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 12,
                  opacity: u.deactivated ? 0.5 : 1,
                }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 2,
                      background: 'var(--bg-inset)', border: '1px solid var(--border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600, color: 'var(--fg-secondary)',
                      flexShrink: 0,
                    }}>{u.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                    {u.self && <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>(you)</span>}
                    {u.deactivated && <Badge tone="fail">deactivated</Badge>}
                  </div>
                  <span style={{ width: 200, color: 'var(--fg-secondary)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                  <span style={{ width: 60 }}>
                    {u.role === 'admin' ? <Badge tone="accent">admin</Badge> : <Badge tone="neutral">user</Badge>}
                  </span>
                  <span style={{ width: 90, color: 'var(--fg-tertiary)', fontSize: 11 }}>{u.joined}</span>
                  <span style={{ width: 70, color: 'var(--fg-tertiary)', fontSize: 11 }}>{u.last}</span>
                  <Button variant="ghost" size="sm" icon="chevronDown" title="actions" style={{ width: 28, padding: 0, justifyContent: 'center' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsLayout>
    </AppShell>
  );
}

// ===========================================================================
// INVITE USER MODAL — overlay on UsersScreen
// ===========================================================================
function InviteModalScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <UsersScreen />
      {/* scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      {/* modal */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 420,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
        padding: 20,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em' }}>invite user</h2>
          <Button variant="ghost" size="sm" icon="x" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
          generates a single-use invitation token. share the resulting URL with the recipient by any channel — no email is sent.
        </div>
        <Field label="email" value="kira@acme.dev" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>role</span>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 2, overflow: 'hidden' }}>
            <button style={{ flex: 1, height: 32, background: 'var(--bg-active)', border: 'none', color: 'var(--fg-primary)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}>user</button>
            <button style={{ flex: 1, height: 32, background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-default)', color: 'var(--fg-tertiary)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}>admin</button>
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>default is user. admins can manage projects, users, and instance settings.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" size="md" style={{ marginLeft: 'auto' }}>cancel</Button>
          <Button variant="primary" size="md" icon="plus">create invitation</Button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// API KEYS SCREEN — /settings/api-keys
// ===========================================================================
const KEYS = [
  { id: 'k1', name: 'ci · github actions',     created: '2026-04-14', lastUsed: '2m ago',     prefix: 'ovr_pk_•••' },
  { id: 'k2', name: 'local dev',                created: '2026-04-22', lastUsed: '4h ago',     prefix: 'ovr_pk_•••' },
  { id: 'k3', name: 'staging deploy',           created: '2026-05-02', lastUsed: '3d ago',     prefix: 'ovr_pk_•••' },
  { id: 'k4', name: 'experiment · phoenix',     created: '2026-03-30', lastUsed: 'never',      prefix: 'ovr_pk_•••', stale: true },
];

function ApiKeysScreen({ withReveal }) {
  return (
    <AppShell breadcrumb={{ project: null, view: 'settings' }}>
      <SettingsLayout section="apikeys">
        <div style={{ padding: '24px 32px', maxWidth: 880 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>api keys</h1>
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--fg-tertiary)' }}>({KEYS.length})</span>
            <div style={{ marginLeft: 'auto' }}>
              <Button variant="primary" size="md" icon="plus">new key</Button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 20, lineHeight: 1.5 }}>
            api keys authenticate the CLI. each is bound to your account. only the key&nbsp;<em>name</em> and last-used timestamp are stored — the secret value is shown <span style={{ color: 'var(--accent-primary)' }}>exactly once</span> at creation.
          </div>

          {/* reveal-once card */}
          {withReveal && (
            <div style={{ marginBottom: 24 }}>
              <Alert tone="accent" title="copy this key now · shown once">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{
                    padding: '10px 12px',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 2,
                    fontSize: 12, color: 'var(--fg-primary)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    wordBreak: 'break-all',
                  }}>
                    <span style={{ flex: 1 }}>ovr_pk_live_9f2a8e6c4b1d0a3f5e7c9b2d4a6f8e0c</span>
                    <Button variant="secondary" size="sm" icon="externalLink">copy</Button>
                  </div>
                  <div style={{ color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
                    set <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>OVR_API_KEY</code> in your CI environment, or pass <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>--api-key</code> to <code style={{ background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 2, color: 'var(--fg-secondary)' }}>ovr snapshot</code>.
                  </div>
                </div>
              </Alert>
            </div>
          )}

          {/* keys table */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', height: 30, padding: '0 12px', gap: 12,
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--fg-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ flex: 1 }}>name</span>
              <span style={{ width: 130 }}>prefix</span>
              <span style={{ width: 100 }}>created</span>
              <span style={{ width: 90 }}>last used</span>
              <span style={{ width: 60 }} />
            </div>
            {KEYS.map((k, i) => (
              <div key={k.id} style={{
                display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', gap: 12,
                borderBottom: i < KEYS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontSize: 12,
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Icon name="command" size={12} style={{ color: 'var(--fg-tertiary)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.name}</span>
                </div>
                <span style={{ width: 130, color: 'var(--fg-tertiary)', fontSize: 11 }}>{k.prefix}</span>
                <span style={{ width: 100, color: 'var(--fg-tertiary)', fontSize: 11 }}>{k.created}</span>
                <span style={{ width: 90, color: k.stale ? 'var(--status-stale)' : 'var(--fg-tertiary)', fontSize: 11 }}>
                  {k.stale && <Glyph kind="stale" size={10} style={{ marginRight: 4 }} />}
                  {k.lastUsed}
                </span>
                <Button variant="ghost" size="sm" icon="x" title="revoke" />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>cli usage</span>
            <Command>ovr snapshot --project checkout-flow --api-key $OVR_API_KEY --branch pr/483</Command>
            <CodeBlock
              label="ovr.config.ts"
              filename="ovr.config.ts"
              showCopy
              lines={[
                "import { defineConfig } from 'ovr';",
                "",
                "export default defineConfig({",
                "  serverUrl: 'https://ovr.acme.dev',",
                "  // apiKey:   process.env.OVR_API_KEY,",
                "  project:   'checkout-flow',",
                "  variants:  ['desktop', 'mobile'],",
                "});",
              ]}
            />
          </div>
        </div>
      </SettingsLayout>
    </AppShell>
  );
}

Object.assign(window, { AppShell, SettingsLayout, UsersScreen, InviteModalScreen, ApiKeysScreen });
