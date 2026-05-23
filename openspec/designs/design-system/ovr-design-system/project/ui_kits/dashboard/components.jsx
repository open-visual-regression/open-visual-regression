/* global React */
// OVR — primitive components. All tokens come from colors_and_type.css.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------------------------------------------------------------------------
// Icon — inline Lucide-style SVG with currentColor. 1.5px stroke, 24 vb.
// ---------------------------------------------------------------------------
const ICONS = {
  search: 'M21 21l-4.3-4.3 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  gitBranch: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  gitCommit: 'M3 12h6 M15 12h6 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  gitPullRequest: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9v12',
  play: 'M6 3l14 9-14 9V3z',
  rotateCcw: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18 M6 6l12 12',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  arrowLeftRight: 'M8 3L4 7l4 4 M4 7h16 M16 21l4-4-4-4 M20 17H4',
  columns: 'M12 3v18 M3 3h18v18H3z',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M9.88 9.88a3 3 0 1 0 4.24 4.24 M10.73 5.08A11 11 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68 M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61 M2 2l20 20',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  plus: 'M12 5v14 M5 12h14',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  command: 'M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
  monitor: 'M2 3h20v14H2z M8 21h8 M12 17v4',
};

function Icon({ name, size = 16, style, ...rest }) {
  const d = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ flexShrink: 0, ...style }}
      {...rest}
    >
      {d && d.split(' M').map((seg, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + seg} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Button — primary / secondary / ghost / destructive · sm / md / lg
// ---------------------------------------------------------------------------
const BUTTON_SIZES = {
  sm: { height: 28, padX: 10, font: 11 },
  md: { height: 32, padX: 14, font: 12 },
  lg: { height: 40, padX: 18, font: 13 },
};

function Button({
  children, variant = 'secondary', size = 'md', disabled, onClick, type = 'button',
  icon, iconRight, style, ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const sz = BUTTON_SIZES[size];

  let bg, color, border;
  if (disabled) {
    bg = 'var(--bg-elevated)';
    color = 'var(--fg-muted)';
    border = '1px solid var(--border-subtle)';
  } else if (variant === 'primary') {
    bg = press ? 'var(--accent-primary-press)'
       : hover ? 'var(--accent-primary-hover)'
       : 'var(--accent-primary)';
    color = 'var(--fg-on-accent)';
    border = '1px solid transparent';
  } else if (variant === 'destructive') {
    bg = press ? 'oklch(0.68 0.23 25 / 0.18)'
       : hover ? 'oklch(0.68 0.23 25 / 0.10)'
       : 'transparent';
    color = 'var(--diff-remove)';
    border = '1px solid var(--diff-remove)';
  } else if (variant === 'ghost') {
    bg = press ? 'var(--bg-active)'
       : hover ? 'var(--bg-hover)'
       : 'transparent';
    color = 'var(--fg-secondary)';
    border = '1px solid transparent';
  } else { /* secondary */
    bg = press ? 'var(--bg-active)'
       : hover ? 'var(--bg-hover)'
       : 'var(--bg-elevated)';
    color = 'var(--fg-primary)';
    border = '1px solid var(--border-default)';
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        height: sz.height,
        padding: `0 ${sz.padX}px`,
        background: bg,
        color,
        border,
        borderRadius: 2,
        fontFamily: 'inherit',
        fontSize: sz.font,
        fontWeight: variant === 'primary' ? 600 : 500,
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 12 : 14} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge — bracketed status indicator
// ---------------------------------------------------------------------------
function Badge({ children, tone = 'neutral', filled = false, style, ...rest }) {
  const toneColors = {
    pass:    'var(--diff-add)',
    fail:    'var(--diff-remove)',
    pending: 'var(--status-pending)',
    stale:   'var(--status-stale)',
    accent:  'var(--accent-primary)',
    neutral: 'var(--fg-secondary)',
  };
  const c = toneColors[tone] || toneColors.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: 2,
        background: filled ? c : 'transparent',
        color: filled ? (tone === 'accent' ? 'var(--fg-on-accent)' : 'var(--bg-base)') : c,
        border: filled ? '1px solid transparent' : `1px solid ${c}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Glyph — unicode status character with semantic color
// ---------------------------------------------------------------------------
const GLYPHS = {
  changed:  { ch: '●', color: 'var(--status-fail)' },
  passed:   { ch: '○', color: 'var(--status-pass)' },
  pending:  { ch: '◐', color: 'var(--status-pending)' },
  stale:    { ch: '△', color: 'var(--status-stale)' },
  approved: { ch: '✓', color: 'var(--diff-add)' },
  rejected: { ch: '✗', color: 'var(--diff-remove)' },
  delta:    { ch: 'Δ', color: 'var(--accent-primary)' },
};
function Glyph({ kind, size = 14, style }) {
  const g = GLYPHS[kind];
  if (!g) return null;
  return (
    <span style={{ color: g.color, fontSize: size, lineHeight: 1, fontFamily: 'inherit', ...style }}>
      {g.ch}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KeyHint — keyboard shortcut chip
// ---------------------------------------------------------------------------
function KeyHint({ children, style }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 18,
      height: 18,
      padding: '0 4px',
      fontSize: 10,
      fontWeight: 500,
      color: 'var(--fg-tertiary)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 2,
      fontFamily: 'inherit',
      ...style,
    }}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Field — labeled input
// ---------------------------------------------------------------------------
function Field({ label, value, placeholder, onChange, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && (
        <label style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-secondary)',
        }}>{label}</label>
      )}
      <input
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          height: 32, padding: '0 10px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${focus ? 'var(--accent-primary)' : 'var(--border-default)'}`,
          borderRadius: 2,
          color: 'var(--fg-primary)',
          fontFamily: 'inherit', fontSize: 12,
          outline: focus ? '2px solid var(--accent-primary-ring)' : 'none',
          outlineOffset: 0,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiffStrip — 3px left edge for run rows
// ---------------------------------------------------------------------------
function DiffStrip({ status, style }) {
  const colors = {
    changed: 'var(--diff-change)',
    pass:    'var(--diff-add)',
    fail:    'var(--diff-remove)',
    pending: 'var(--status-pending)',
    stale:   'var(--status-stale)',
  };
  return <div style={{ width: 3, alignSelf: 'stretch', background: colors[status] || 'var(--border-default)', ...style }} />;
}

// ---------------------------------------------------------------------------
// OvrMark — the brand mark, inline. So we don't rely on the asset path.
// ---------------------------------------------------------------------------
function OvrMark({ size = 24 }) {
  // The mark is just an amber vertical bar — 1/6th width to height ratio.
  const w = Math.max(3, Math.round(size / 6));
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} fill="none">
      <rect x="0" y={size * 0.06} width={w} height={size * 0.88} fill="var(--accent-primary)" />
    </svg>
  );
}

Object.assign(window, {
  Icon, Button, Badge, Glyph, KeyHint, Field, DiffStrip, OvrMark, GLYPHS, ICONS,
});
