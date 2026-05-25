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

const Mark = ({ w, h, surface }: { w: number; h: number; surface: LogoSurface }) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    fill="currentColor"
    aria-hidden="true"
    className={surface === "accent" ? "text-ovr-on-accent shrink-0" : "text-ovr-accent shrink-0"}
  >
    <rect width="100%" height="100%" />
  </svg>
);

const Logo = ({ size = "sm", surface = "default", className }: LogoProps) => (
  <div
    className={cn(
      "inline-flex items-center",
      size === "sm" ? "gap-[7px]" : "gap-[10px]",
      className,
    )}
  >
    <Mark w={size === "sm" ? 3 : 4} h={size === "sm" ? 18 : 28} surface={surface} />
    <span
      className={cn(
        size === "sm" ? "text-sm tracking-h1" : "text-2xl tracking-display",
        "font-medium leading-none",
        surface === "default" ? "text-ovr-fg" : "text-ovr-on-accent",
      )}
    >
      ovr
    </span>
  </div>
);

const LogoFull = ({ surface = "default", className }: LogoFullProps) => (
  <div className={cn("inline-flex items-center gap-[14px]", className)}>
    <Mark w={6} h={64} surface={surface} />
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[32px] tracking-[-0.04em] font-medium leading-none",
            surface === "default" ? "text-ovr-fg" : "text-ovr-on-accent",
          )}
        >
          ovr
        </span>
        <span
          className={cn(
            "inline-block shrink-0",
            surface === "accent" ? "text-ovr-on-accent" : "text-ovr-accent",
          )}
          style={{ width: 14, height: 22 }}
        />
      </div>
      <span
        className={cn(
          "text-label tracking-label uppercase",
          surface === "default" ? "text-ovr-fg" : "text-ovr-on-accent",
        )}
      >
        open visual regression
      </span>
    </div>
  </div>
);

export { Logo, LogoFull };
export type { LogoProps, LogoFullProps, LogoSize, LogoSurface };
