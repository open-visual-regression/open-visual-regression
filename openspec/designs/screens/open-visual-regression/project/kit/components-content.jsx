/* global React */
// OVR — Logs + CodeBlock + Command primitives.
// Match design system: components-logs.html and components-codeblock.html.

// ---------------------------------------------------------------------------
// Logs — streaming console, 4-col tabular grid.
//   streaming: shows pulsing live dot in header
//   entries: [{ t, lv: 'info'|'warn'|'error'|'debug', source, msg }]
//   activeLevel: 'all' | 'info' | 'warn' | 'error'
//   maxHeight: scrollable
// ---------------------------------------------------------------------------
const LOG_LEVEL_COLOR = {
  info:  'var(--diff-add)',
  warn:  'var(--status-pending)',
  error: 'var(--diff-remove)',
  debug: 'var(--fg-tertiary)',
};
const LOG_LEVEL_LABEL = {
  info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG',
};

function Logs({
  streaming = false,
  entries = [],
  activeLevel = 'all',
  showFilter = true,
  showCopy = true,
  maxHeight = 240,
  compact = false,
  style,
}) {
  const filtered = activeLevel === 'all' ? entries : entries.filter((e) => e.lv === activeLevel);
  const grid = compact
    ? '64px 44px 1fr'
    : '104px 56px 84px 1fr';
  return (
    <div style={{
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 2,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 32, padding: '0 8px 0 12px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-default)',
        gap: 10, flexShrink: 0,
      }}>
        {streaming && (
          <span style={{
            color: 'var(--status-pending)',
            fontSize: 13,
            animation: 'ovrLogPulse 1.4s ease-in-out infinite',
          }}>●</span>
        )}
        {showFilter && (
          <div style={{
            display: 'inline-flex',
            border: '1px solid var(--border-default)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            {['all', 'info', 'warn', 'error'].map((lv, i) => {
              const isActive = activeLevel === lv;
              return (
                <button key={lv} style={{
                  height: 22, padding: '0 8px',
                  background: isActive ? 'var(--bg-active)' : 'var(--bg-elevated)',
                  color: isActive
                    ? 'var(--fg-primary)'
                    : lv === 'all' ? 'var(--fg-secondary)' : LOG_LEVEL_COLOR[lv],
                  border: 'none',
                  borderRight: i < 3 ? '1px solid var(--border-default)' : 'none',
                  fontFamily: 'inherit', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>{lv}</button>
              );
            })}
          </div>
        )}
        {showCopy && (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 22, padding: '0 8px', marginLeft: 'auto',
            background: 'var(--bg-elevated)',
            color: 'var(--fg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            fontFamily: 'inherit', fontSize: 10, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
            <CopyGlyph /> copy
          </button>
        )}
      </div>
      {/* lines */}
      <div style={{ padding: '6px 0', maxHeight, overflow: 'auto', flex: 1, minHeight: 0 }}>
        {filtered.map((e, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: grid,
            alignItems: 'baseline', gap: compact ? 8 : 12,
            padding: '1px 12px',
            fontSize: compact ? 10 : 11, lineHeight: 1.6,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.t}</span>
            <span style={{ color: LOG_LEVEL_COLOR[e.lv] || 'var(--fg-tertiary)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {LOG_LEVEL_LABEL[e.lv] || e.lv?.toUpperCase()}
            </span>
            {!compact && <span style={{ color: 'var(--fg-tertiary)' }}>{e.source}</span>}
            <span style={{
              color: e.lv === 'error' ? 'var(--diff-remove)'
                : e.lv === 'warn' ? 'var(--status-pending)'
                : 'var(--fg-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock — multi-line with line numbers. Header has label + filename + copy.
//   lines: [string]  OR  [{ text, tone: 'error'|'normal'|'dim' }]
//   label, filename, lineCount (defaults to lines.length)
//   maxHeight: scrollable
// ---------------------------------------------------------------------------
function CodeBlock({ label = 'STACKTRACE', filename, lines = [], maxHeight = 220, showCopy = true, style }) {
  const items = lines.map((l) => typeof l === 'string' ? { text: l, tone: 'normal' } : l);
  return (
    <div style={{
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 2,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 32, padding: '0 12px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>{label}</span>
        {filename && <span style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginLeft: 12 }}>{filename}</span>}
        <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 'auto', marginRight: showCopy ? 10 : 0 }}>{items.length} lines</span>
        {showCopy && (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 24, padding: '0 8px',
            background: 'var(--bg-elevated)',
            color: 'var(--fg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            fontFamily: 'inherit', fontSize: 10, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}><CopyGlyph /> copy</button>
        )}
      </div>
      <div style={{ padding: '8px 0', maxHeight, overflow: 'auto' }}>
        {items.map((l, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '0 12px',
            fontSize: 11, lineHeight: 1.6,
            color: l.tone === 'error'
              ? 'var(--diff-remove)'
              : l.tone === 'dim'
              ? 'var(--fg-tertiary)'
              : 'var(--fg-primary)',
            fontWeight: l.tone === 'error' ? 600 : 400,
            whiteSpace: 'pre',
          }}>
            <span style={{ color: 'var(--fg-muted)', textAlign: 'right', width: 18, userSelect: 'none', flexShrink: 0 }}>{i + 1}</span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Command — single-line codeblock with $ prompt, horizontal scroll.
// ---------------------------------------------------------------------------
function Command({ children, prompt = '$', showCopy = true, style }) {
  return (
    <div style={{
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 2,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 12 }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: 12, flexShrink: 0 }}>{prompt}</span>
        <div style={{
          flex: 1, minWidth: 0, overflowX: 'auto',
          fontSize: 12, color: 'var(--fg-primary)',
          whiteSpace: 'nowrap',
        }}>{children}</div>
        {showCopy && (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 24, padding: '0 8px',
            background: 'var(--bg-elevated)',
            color: 'var(--fg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            fontFamily: 'inherit', fontSize: 10, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer', flexShrink: 0,
          }}><CopyGlyph /> copy</button>
        )}
      </div>
    </div>
  );
}

// inline copy svg
function CopyGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// inject pulse keyframes once
if (typeof document !== 'undefined' && !document.getElementById('ovr-logs-keyframes')) {
  const style = document.createElement('style');
  style.id = 'ovr-logs-keyframes';
  style.textContent = `@keyframes ovrLogPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`;
  document.head.appendChild(style);
}

Object.assign(window, { Logs, CodeBlock, Command });
