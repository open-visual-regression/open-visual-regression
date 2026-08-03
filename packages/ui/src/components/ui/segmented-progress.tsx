import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

export type SegmentedProgressSize = "sm" | "md" | "lg";

type SegmentColor = "green" | "amber" | "red" | "blue" | "gray" | "purple";

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
      return "bg-ovr-green";
    case "amber":
      return "bg-ovr-amber";
    case "red":
      return "bg-ovr-red";
    case "blue":
      return "bg-ovr-blue";
    case "gray":
      return "bg-ovr-gray";
    case "purple":
      return "bg-ovr-purple";
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

type SegmentedProgressSkeletonProps = {
  legendItems?: number;
  size?: SegmentedProgressProps["size"];
  className?: string;
};

const SegmentedProgressSkeleton = ({
  legendItems = 4,
  size = "md",
  className,
}: SegmentedProgressSkeletonProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-4 w-28" />
    </div>
    <Skeleton
      className={cn("rounded-xs", {
        "h-2": size === "sm",
        "h-4": size === "md",
        "h-6": size === "lg",
      })}
    />
    <ul className="flex flex-wrap gap-x-3.5 gap-y-1">
      {Array.from({ length: legendItems }, (_, i) => (
        <li key={i} className="flex items-center gap-1">
          <Skeleton className="size-2 shrink-0 rounded-none" />
          <Skeleton className="h-4 w-14" />
        </li>
      ))}
    </ul>
  </div>
);

export { SegmentedProgress, SegmentedProgressSkeleton };
export type { Segment, SegmentedProgressProps, SegmentedProgressSkeletonProps };
