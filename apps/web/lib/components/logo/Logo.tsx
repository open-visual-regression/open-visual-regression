import { cn } from "@ovr/ui/lib/utils";

type LogoSize = "sm" | "lg" | "xl";
type LogoSurface = "default" | "light" | "accent";

interface LogoProps {
  size?: LogoSize;
  surface?: LogoSurface;
  wordmark?: boolean;
}

const SIZE_CONFIG = {
  sm: {
    markW: 3,
    markH: 18,
    gap: "gap-[7px]",
    wordmarkClass: "text-sm font-medium tracking-h1 leading-none",
    cursor: null,
    tagline: false,
  },
  lg: {
    markW: 4,
    markH: 28,
    gap: "gap-[10px]",
    wordmarkClass: "text-2xl font-medium tracking-display leading-none",
    cursor: null,
    tagline: false,
  },
  xl: {
    markW: 6,
    markH: 64,
    gap: "gap-[14px]",
    wordmarkClass: "text-[32px] font-medium tracking-[-0.04em] leading-none",
    cursor: { w: 14, h: 22 },
    tagline: true,
  },
} as const satisfies Record<LogoSize, object>;

const MARK_COLOR: Record<LogoSurface, string> = {
  default: "text-ovr-accent",
  light: "text-ovr-accent",
  accent: "text-ovr-on-accent",
};

const TEXT_COLOR: Record<LogoSurface, string> = {
  default: "text-ovr-fg",
  light: "text-ovr-on-accent",
  accent: "text-ovr-on-accent",
};

const TAGLINE_COLOR: Record<LogoSurface, string> = {
  default: "text-ovr-fg-tertiary",
  light: "text-ovr-on-accent",
  accent: "text-ovr-on-accent",
};

const Logo = ({ size = "sm", surface = "default", wordmark = true }: LogoProps) => {
  const { markW, markH, gap, wordmarkClass, cursor, tagline } = SIZE_CONFIG[size];

  return (
    <div className={cn("inline-flex items-center shrink-0", gap)}>
      <span className={cn("shrink-0", MARK_COLOR[surface])}>
        <svg
          width={markW}
          height={markH}
          viewBox={`0 0 ${markW} ${markH}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <rect width="100%" height="100%" />
        </svg>
      </span>

      {wordmark && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(wordmarkClass, TEXT_COLOR[surface])}>ovr</span>
            {cursor && (
              <span
                className={cn("inline-block shrink-0", MARK_COLOR[surface])}
                style={{ width: cursor.w, height: cursor.h }}
              />
            )}
          </div>
          {tagline && (
            <span className={cn("text-label tracking-label uppercase", TAGLINE_COLOR[surface])}>
              open visual regression
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export { Logo };
export type { LogoProps, LogoSize, LogoSurface };
