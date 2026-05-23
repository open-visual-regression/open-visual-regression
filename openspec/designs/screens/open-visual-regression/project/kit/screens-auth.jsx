/* global React, Icon, Button, Badge, Glyph, KeyHint, Field, OvrMark, Alert */
// OVR — auth screens: SetupScreen, LoginScreen, InviteScreen (valid/expired/used)

const { useState: useAuthState } = React;

// ---------------------------------------------------------------------------
// Layout primitive — centered card on dark page
// ---------------------------------------------------------------------------
function AuthShell({ children, w = 420 }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg-base)',
      backgroundImage: 'var(--pixel-grid)',
      backgroundSize: 'var(--pixel-grid-size)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ width: w, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <OvrMark size={22} />
          <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>ovr</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthCard({ title, sub, children, footer }) {
  return (
    <>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>{title}</h1>
          {sub && <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>{sub}</div>}
        </div>
        {children}
      </div>
      {footer && (
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', textAlign: 'center' }}>
          {footer}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// SETUP — first-run wizard (/setup)
// ---------------------------------------------------------------------------
function SetupScreen() {
  return (
    <AuthShell w={460}>
      <AuthCard
        title="first-run setup"
        sub="no users exist yet. create the organization and the first admin account. this page disappears after setup completes."
        footer="self-hosted · v0.4.2"
      >
        {/* steps */}
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--fg-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent-primary)' }}>01 organization</span>
          <span>·</span>
          <span style={{ color: 'var(--accent-primary)' }}>02 admin</span>
          <span style={{ marginLeft: 'auto', color: 'var(--fg-muted)' }}>step 1 of 1</span>
        </div>

        {/* org */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>organization</span>
          <Field label="org name" value="acme" />
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        {/* admin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>admin account</span>
          <Field label="name" value="ari shapiro" />
          <Field label="email" value="ari@acme.dev" />
          <Field label="password" value="••••••••••••" />
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>min 12 chars. <span style={{ color: 'var(--diff-add)' }}>strong</span></div>
        </div>

        <Button variant="primary" size="lg" iconRight="chevronRight" style={{ width: '100%', justifyContent: 'center' }}>
          create admin & continue
        </Button>

        <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          additional users are added by invitation only.<br/>this page is unreachable once an admin exists.
        </div>
      </AuthCard>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------
// LOGIN — /login
// ---------------------------------------------------------------------------
function LoginScreen({ error }) {
  return (
    <AuthShell w={400}>
      <AuthCard
        title="sign in"
        sub="session cookies. no public signup. accounts are issued by invitation."
        footer={<>need an account? <span style={{ color: 'var(--fg-secondary)' }}>ask an admin to invite you.</span></>}
      >
        <Field label="email" value="ari@acme.dev" />
        <Field label="password" value="••••••••••••" />

        {error && (
          <Alert tone="destructive" title="invalid credentials" dismissable={false}>
            check your email and password, or ask an admin to issue a new invitation.
          </Alert>
        )}

        <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
          sign in
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <Glyph kind="pending" size={11} />
          <span>rate-limited after 5 failed attempts / 5min</span>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------
// INVITE — /invite/[invitationId]  — three states
// ---------------------------------------------------------------------------
function InviteScreen({ state = 'valid' }) {
  if (state === 'expired') {
    return (
      <AuthShell w={420}>
        <AuthCard title="invitation expired" sub="invitation tokens are single-use and expire 48 hours after issuance.">
          <Alert tone="pending" title="token expired 1 day ago" dismissable={false}>
            <div style={{ marginTop: 2, lineHeight: 1.6 }}>
              <div>id · inv_8f3a91b</div>
              <div>issued · 2026-05-19 14:22 utc</div>
              <div>expired · 2026-05-21 14:22 utc</div>
            </div>
          </Alert>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
            ask the admin who invited you to issue a fresh link.
          </div>
          <Button variant="secondary" size="md" style={{ width: '100%', justifyContent: 'center' }}>
            return to sign in
          </Button>
        </AuthCard>
      </AuthShell>
    );
  }

  if (state === 'used') {
    return (
      <AuthShell w={420}>
        <AuthCard title="invitation already used" sub="this token has already been redeemed. each invitation can be accepted exactly once.">
          <Alert tone="destructive" title="token consumed" dismissable={false}>
            <div style={{ marginTop: 2, lineHeight: 1.6 }}>
              <div>accepted by · jules@acme.dev</div>
              <div>at · 2026-05-20 09:14 utc</div>
            </div>
          </Alert>
          <Button variant="primary" size="md" style={{ width: '100%', justifyContent: 'center' }}>
            sign in instead
          </Button>
        </AuthCard>
      </AuthShell>
    );
  }

  // valid
  return (
    <AuthShell w={420}>
      <AuthCard
        title="create your account"
        sub={<>invited to <span style={{ color: 'var(--fg-primary)' }}>acme</span> as <span style={{ color: 'var(--accent-primary)' }}>user</span>. set a name and password to finish.</>}
        footer={<>token expires in <span style={{ color: 'var(--fg-secondary)' }}>47h 12m</span></>}
      >
        <div style={{
          padding: '8px 12px',
          background: 'var(--bg-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 2,
          fontSize: 11, color: 'var(--fg-tertiary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="check" size={12} style={{ color: 'var(--diff-add)' }} />
          <span style={{ color: 'var(--fg-secondary)' }}>jules@acme.dev</span>
          <span style={{ marginLeft: 'auto' }}>verified</span>
        </div>

        <Field label="name" value="jules ortega" />
        <Field label="password" value="••••••••••••" />
        <Field label="confirm password" value="••••••••••••" />

        <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
          create account & sign in
        </Button>
      </AuthCard>
    </AuthShell>
  );
}

Object.assign(window, { SetupScreen, LoginScreen, InviteScreen });
