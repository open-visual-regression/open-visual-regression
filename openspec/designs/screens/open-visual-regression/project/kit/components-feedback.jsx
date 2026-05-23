/* global React */
// OVR — Toast + Progress primitives.
// Match design system: preview/components-toast.html and components-progress.html

// ===========================================================================
// TOAST
// ===========================================================================
const TOAST_TONES = {
  success:     { color: 'var(--diff-add)',       glyph: '✓' },
  pending:     { color: 'var(--status-pending)', glyph: '△' },
  destructive: { color: 'var(--diff-remove)',    glyph: '●' },
  accent:      { color: 'var(--accent-primary)', glyph: '●' },
  neutral:     { color: 'var(--fg-secondary)',   glyph: '◐' },
};

function Toast({ tone = 'success', title, children, action, dismissable = true, width = 340, glyph }) {
  const t = TOAST_TONES[tone] || TOAST_TONES.success;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 2,
      boxShadow: 'var(--shadow-popover, 0 8px 24px -8px rgba(0,0,0,0.6))',
      overflow: 'hidden', width,
    }}>
      <div style={{ width: 3, background: t.color, flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', flex: 1, minWidth: 0 }}>
        <span style={{ color: t.color, fontSize: 13, lineHeight: 1.2, flexShrink: 0, marginTop: 1 }}>{glyph || t.glyph}</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</div>}
          {children && <div style={{ fontSize: 11, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>{children}</div>}
        </div>
        {action && (
          <button style={{
            height: 22, padding: '0 8px',
            background: 'transparent', color: t.color,
            border: `1px solid ${t.color}`, borderRadius: 2,
            fontFamily: 'inherit', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer', whiteSpace: 'nowrap',
            alignSelf: 'center', flexShrink: 0,
          }}>{action.label}</button>
        )}
        {dismissable && (
          <button style={{
            width: 16, height: 16, padding: 0,
            background: 'transparent', color: 'var(--fg-tertiary)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, lineHeight: 1,
            flexShrink: 0, alignSelf: 'flex-start', marginTop: 1,
          }}>✗</button>
        )}
      </div>
    </div>
  );
}

// ToastStack — bottom-right floating stack. position absolute to its container.
function ToastStack({ children, anchor = 'bottom-right' }) {
  const pos = anchor === 'bottom-right'
    ? { bottom: 16, right: 16, alignItems: 'flex-end' }
    : anchor === 'bottom-center'
    ? { bottom: 16, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
    : anchor === 'mobile' // full-width, near bottom but above tab/action bars
    ? { bottom: 70, left: 12, right: 12, alignItems: 'stretch' }
    : { top: 16, right: 16, alignItems: 'flex-end' };
  return (
    <div style={{
      position: 'absolute', zIndex: 60,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
      ...pos,
    }}>
      {React.Children.map(children, (c, i) => (
        <div key={i} style={{ pointerEvents: 'auto' }}>{c}</div>
      ))}
    </div>
  );
}

// ===========================================================================
// PROGRESS — single bar with optional label
// ===========================================================================
function Progress({ value = 0, label, valueLabel, indeterminate = false, height = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(label || valueLabel) && (
        <div style={{ display: 'flex', fontSize: 11 }}>
          {label && <span style={{ color: 'var(--fg-secondary)' }}>{label}</span>}
          {valueLabel !== undefined && <span style={{ marginLeft: 'auto', color: 'var(--fg-tertiary)' }}>{valueLabel}</span>}
        </div>
      )}
      <div style={{
        height, background: 'var(--bg-inset)',
        borderRadius: 2, overflow: 'hidden', position: 'relative',
      }}>
        {indeterminate ? (
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%', width: '30%',
            background: 'var(--accent-primary)',
            animation: 'ovrProgIndeterminate 1.4s ease-in-out infinite',
          }} />
        ) : (
          <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: 'var(--accent-primary)' }} />
        )}
      </div>
    </div>
  );
}

// Inject the indeterminate keyframes once on the document.
if (typeof document !== 'undefined' && !document.getElementById('ovr-progress-keyframes')) {
  const style = document.createElement('style');
  style.id = 'ovr-progress-keyframes';
  style.textContent = `
    @keyframes ovrProgIndeterminate {
      0%   { left: -30%; }
      100% { left: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// ===========================================================================
// SEGMENTED PROGRESS — multi-status colored bar
//   segments: [{ label, count, color }]
//   height: bar thickness
//   legend: show legend chips below
// ===========================================================================
function SegmentedProgress({ title, subtitle, summary, segments = [], height = 8, legend = true }) {
  const total = segments.reduce((s, x) => s + (x.count || 0), 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(title || subtitle || summary) && (
        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 11 }}>
          {title && <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</span>}
          {subtitle && <span style={{ color: 'var(--fg-tertiary)', marginLeft: 8 }}>{subtitle}</span>}
          {summary && <span style={{ marginLeft: 'auto', color: 'var(--fg-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{summary}</span>}
        </div>
      )}
      <div style={{
        display: 'flex', height,
        background: 'var(--bg-inset)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            width: `${(s.count / total) * 100}%`,
            background: s.color,
            borderRight: i < segments.length - 1 ? '1px solid var(--bg-base)' : 'none',
          }} />
        ))}
      </div>
      {legend && (
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--fg-tertiary)', flexWrap: 'wrap' }}>
          {segments.filter((s) => s.count > 0).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: s.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--fg-secondary)' }}>{s.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Toast, ToastStack, Progress, SegmentedProgress });
