import { cn } from "../../lib/utils";

export type SegmentedProgressSize = "sm" | "md" | "lg";

type SegmentColor = "green" | "teal" | "orange" | "red" | "maroon" | "blue" | "gray";

type Segment = {
  label: string;
  count: number;
  color: SegmentColor;
};

type SegmentedProgressProps = {
  segments: Segment[];
  title?: string;
  subtitle?: string;
  size?: SegmentedProgressSize;
  className?: string;
};

const getColor = (color: SegmentColor) => {
  switch (color) {
    case "green":
      return "bg-ovr-status-passed";
    case "teal":
      return "bg-ovr-status-approved";
    case "orange":
      return "bg-ovr-status-needs-review";
    case "red":
      return "bg-ovr-status-error";
    case "maroon":
      return "bg-ovr-status-rejected";
    case "blue":
      return "bg-ovr-status-pending";
    case "gray":
      return "bg-ovr-fg-muted";
  }
};

const SegmentedProgress = ({
  segments,
  title,
  subtitle,
  size = "md",
  className,
}: SegmentedProgressProps) => {
  const active = segments.filter((s) => s.count > 0);
  const total = active.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {title || subtitle ? (
        <div className="flex items-baseline gap-2">
          {title ? (
            <span className="font-mono text-label font-semibold tracking-label uppercase text-ovr-fg-secondary">
              {title}
            </span>
          ) : null}
          {subtitle ? (
            <span className="font-mono text-label font-normal leading-body text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "flex gap-px overflow-hidden rounded-xs bg-background",
          { "h-2": size === "sm", "h-4": size === "md", "h-6": size === "lg" },
          className,
        )}
      >
        {active.map((s, i) => (
          <div
            key={i}
            className={cn(getColor(s.color))}
            // oxlint-disable-next-line react/forbid-dom-props
            style={{ flexBasis: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1">
        {active.map((s, i) => (
          <li key={i} className="flex items-center gap-1" aria-label={`${s.count} ${s.label}`}>
            <span className={cn("size-2 shrink-0", getColor(s.color))} />
            <span className="font-mono text-badge text-ovr-fg-secondary">{s.count}</span>
            <span className="font-mono text-badge text-ovr-fg-secondary">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { SegmentedProgress };
export type { Segment, SegmentedProgressProps };
