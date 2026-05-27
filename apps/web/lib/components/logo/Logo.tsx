import { cn } from "@ovr/ui/lib/utils";

type LogoSize = "sm" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

interface LogoFullProps {
  className?: string;
}

const Mark = ({ w, h }: { w: number; h: number }) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    fill="currentColor"
    aria-hidden="true"
    className="text-ovr-accent shrink-0"
  >
    <rect width="100%" height="100%" />
  </svg>
);

const Logo = ({ size = "sm", className }: LogoProps) => (
  <div
    className={cn("inline-flex items-center", size === "sm" ? "gap-1.75" : "gap-2.5", className)}
  >
    <Mark w={size === "sm" ? 3 : 4} h={size === "sm" ? 18 : 28} />
    <span
      className={cn(
        size === "sm" ? "text-sm tracking-h1" : "text-2xl tracking-display",
        "font-medium leading-none text-ovr-fg",
      )}
    >
      ovr
    </span>
  </div>
);

const LogoFull = ({ className }: LogoFullProps) => (
  <div className={cn("inline-flex items-center gap-3.5", className)}>
    <Mark w={6} h={64} />
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[32px] tracking-[-0.04em] font-medium leading-none text-ovr-fg">
          ovr
        </span>
        <span className="inline-block shrink-0 w-3.5 h-5.5 text-ovr-accent" />
      </div>
      <span className="text-label tracking-label uppercase text text-muted-foreground">
        open visual regression
      </span>
    </div>
  </div>
);

export { Logo, LogoFull };
export type { LogoProps, LogoFullProps, LogoSize };
