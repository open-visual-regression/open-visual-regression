const SIZE_CONFIG = {
  sm: { markHeight: 22, textSize: 14, letterSpacing: "-0.02em", gap: 8 },
  lg: { markHeight: 34, textSize: 28, letterSpacing: "-0.03em", gap: 8 },
} as const;

type LogoSize = keyof typeof SIZE_CONFIG;

interface LogoProps {
  size?: LogoSize;
  wordmark?: boolean;
  onAccent?: boolean;
}

function Logo({ size = "sm", wordmark = true, onAccent = false }: LogoProps) {
  const { markHeight, textSize, letterSpacing, gap } = SIZE_CONFIG[size];
  const markWidth = Math.max(3, Math.round(markHeight / 6));
  const markFill = onAccent ? "#101013" : "var(--ovr-accent-primary)";
  const textColor = onAccent ? "#101013" : "var(--ovr-fg-primary)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        flexShrink: 0,
      }}
    >
      <svg
        width={markWidth}
        height={markHeight}
        viewBox={`0 0 ${markWidth} ${markHeight}`}
        fill="none"
        aria-hidden="true"
      >
        <rect width="100%" height="100%" rx="0" fill={markFill} />
      </svg>
      {wordmark && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 500,
            letterSpacing,
            color: textColor,
            lineHeight: 1,
          }}
        >
          ovr
        </span>
      )}
    </div>
  );
}

export { Logo };
export type { LogoProps, LogoSize };
