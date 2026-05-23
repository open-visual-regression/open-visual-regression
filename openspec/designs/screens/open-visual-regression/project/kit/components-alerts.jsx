/* global React, Button */
// OVR — Alert + AlertDialog primitives.
// Matches design system: preview/components-alert.html and components-alert-dialog.html

// ---------------------------------------------------------------------------
// TONES — design system has 4: accent (info/new), pending (warning/stale),
// success (add), destructive (remove).
// ---------------------------------------------------------------------------
const ALERT_TONES = {
  accent: {
    bg:     'var(--accent-primary-dim)',
    border: 'var(--accent-primary)',
    fg:     'var(--accent-primary)',
    glyph:  '●',
  },
  pending: {
    bg:     'oklch(0.72 0.13 230 / 0.10)',
    border: 'var(--status-pending)',
    fg:     'var(--status-pending)',
    glyph:  '△',
  },
  success: {
    bg:     'var(--diff-add-dim)',
    border: 'var(--diff-add)',
    fg:     'var(--diff-add)',
    glyph:  '✓',
  },
  destructive: {
    bg:     'var(--diff-remove-dim)',
    border: 'var(--diff-remove)',
    fg:     'var(--diff-remove)',
    glyph:  '●',
  },
};

// ---------------------------------------------------------------------------
// Alert — inline banner.
//   tone:        'accent' | 'pending' | 'success' | 'destructive'
//   title:       short bold colored title (required)
//   children:    body text
//   action:      { label, onClick }  — outlined button, optional
//   dismissable: boolean — show × at right
//   glyph:       override glyph (otherwise tone default)
// ---------------------------------------------------------------------------
function Alert({ tone = 'accent', title, children, action, dismissable = true, glyph, style }) {
  const t = ALERT_TONES[tone] || ALERT_TONES.accent;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 2,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ width: 3, background: t.border, flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', flex: 1, minWidth: 0 }}>
        <span style={{ color: t.fg, fontSize: 14, lineHeight: 1.2, flexShrink: 0, marginTop: 1 }}>{glyph || t.glyph}</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {title && <div style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>{title}</div>}
          {children && <div style={{ fontSize: 11, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>{children}</div>}
        </div>
        {action && (
          <button onClick={action.onClick} style={{
            height: 24, padding: '0 8px',
            background: 'transparent',
            color: t.fg,
            border: `1px solid ${t.border}`,
            borderRadius: 2,
            fontFamily: 'inherit', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer', whiteSpace: 'nowrap',
            alignSelf: 'center', flexShrink: 0,
          }}>{action.label}</button>
        )}
        {dismissable && (
          <button style={{
            width: 18, height: 18, padding: 0,
            background: 'transparent',
            color: 'var(--fg-tertiary)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14, lineHeight: 1,
            flexShrink: 0, alignSelf: 'flex-start', marginTop: 1,
          }}>✗</button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertDialog — destructive confirmation modal. Always 2 actions.
//   tone:        'destructive' (default) | 'pending' | 'accent'
//   title:       headline
//   children:    body text / evidence block
//   confirmLabel, cancelLabel
//   evidence:    optional inset block — show what's being acted on
//   onConfirm, onCancel
//   open:        if false, returns null
// ---------------------------------------------------------------------------
function AlertDialog({
  tone = 'destructive',
  title,
  children,
  evidence,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm, onCancel,
  open = true,
}) {
  if (!open) return null;
  const t = ALERT_TONES[tone] || ALERT_TONES.destructive;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      {/* backdrop */}
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      {/* dialog */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480,
        background: 'var(--bg-elevated)',
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        boxShadow: 'var(--shadow-modal, 0 24px 64px -16px rgba(0,0,0,0.7))',
        overflow: 'hidden',
      }}>
        {/* accent strip */}
        <div style={{ height: 3, background: t.border }} />

        {/* body */}
        <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 2,
            background: t.bg, border: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: t.fg, fontSize: 16, lineHeight: 1 }}>!</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--fg-primary)' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>{children}</div>
            {evidence && (
              <div style={{
                marginTop: 12, padding: '8px 10px',
                background: 'var(--bg-inset)',
                borderLeft: `2px solid ${t.border}`,
                fontSize: 11, color: 'var(--fg-tertiary)',
              }}>{evidence}</div>
            )}
          </div>
        </div>

        {/* footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button onClick={onCancel} style={{
            height: 32, padding: '0 14px',
            background: 'transparent',
            color: 'var(--fg-secondary)',
            border: 'none', borderRadius: 2,
            fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            height: 32, padding: '0 14px',
            background: t.border,
            color: tone === 'destructive' ? '#fff' : 'var(--fg-on-accent)',
            border: 'none', borderRadius: 2,
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Alert, AlertDialog });
