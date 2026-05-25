import { cva } from "class-variance-authority";

import { cn } from "@ovr/ui/lib/utils";

type LogoSize = "sm" | "lg";
type LogoSurface = "default" | "light" | "accent";

interface LogoProps {
  size?: LogoSize;
  surface?: LogoSurface;
  className?: string;
}

interface LogoFullProps {
  surface?: LogoSurface;
  className?: string;
}

const markColorVariants = cva("shrink-0", {
  variants: {
    surface: {
      default: "text-ovr-accent",
      light: "text-ovr-accent",
      accent: "text-ovr-on-accent",
    },
  },
  defaultVariants: { surface: "default" },
});

const textColorVariants = cva("font-medium leading-none", {
  variants: {
    surface: {
      default: "text-ovr-fg",
      light: "text-ovr-on-accent",
      accent: "text-ovr-on-accent",
    },
  },
  defaultVariants: { surface: "default" },
});

const SIZE_CONFIG = {
  sm: { markW: 3, markH: 18, gap: "gap-[7px]", wordmarkClass: "text-sm tracking-h1" },
  lg: { markW: 4, markH: 28, gap: "gap-[10px]", wordmarkClass: "text-2xl tracking-display" },
} as const satisfies Record<LogoSize, object>;

const FULL = {
  markW: 6,
  markH: 64,
  gap: "gap-[14px]",
  wordmarkClass: "text-[32px] tracking-[-0.04em]",
  cursorW: 14,
  cursorH: 22,
};

const Mark = ({ w, h, surface }: { w: number; h: number; surface: LogoSurface }) => (
  <span className={cn(markColorVariants({ surface }))}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true">
      <rect width="100%" height="100%" />
    </svg>
  </span>
);

const Logo = ({ size = "sm", surface = "default", className }: LogoProps) => {
  const { markW, markH, gap, wordmarkClass } = SIZE_CONFIG[size];
  return (
    <div className={cn("inline-flex items-center", gap, className)}>
      <Mark w={markW} h={markH} surface={surface} />
      <span className={cn(wordmarkClass, textColorVariants({ surface }))}>ovr</span>
    </div>
  );
};

const LogoFull = ({ surface = "default", className }: LogoFullProps) => (
  <div className={cn("inline-flex items-center", FULL.gap, className)}>
    <Mark w={FULL.markW} h={FULL.markH} surface={surface} />
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={cn(FULL.wordmarkClass, textColorVariants({ surface }))}>ovr</span>
        <span
          className={cn("inline-block shrink-0", markColorVariants({ surface }))}
          style={{ width: FULL.cursorW, height: FULL.cursorH }}
        />
      </div>
      <span className={cn("text-label tracking-label uppercase", textColorVariants({ surface }))}>
        open visual regression
      </span>
    </div>
  </div>
);

export { Logo, LogoFull };
export type { LogoProps, LogoFullProps, LogoSize, LogoSurface };
