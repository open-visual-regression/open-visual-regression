import { cn } from "../../lib/utils";

interface Segment {
  label: string;
  count: number;
  color: string;
}

interface SegmentedProgressProps {
  segments: Segment[];
  title?: string;
  subtitle?: string;
  summary?: string;
  height?: number;
  className?: string;
}

const SegmentedProgress = ({
  segments,
  title,
  subtitle,
  summary,
  height = 8,
  className,
}: SegmentedProgressProps) => {
  const active = segments.filter((s) => s.count > 0);
  const total = active.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(title || subtitle) && (
        <div className="flex items-baseline gap-2">
          {title && (
            <span className="font-mono text-label font-semibold tracking-label uppercase text-ovr-fg-secondary">
              {title}
            </span>
          )}
          {subtitle && (
            <span className="font-mono text-label font-normal leading-body text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      )}
      <div className="flex overflow-hidden rounded-[2px] bg-ovr-inset" style={{ height }}>
        {active.map((s, i) => (
          <div
            key={i}
            style={{
              flexBasis: `${(s.count / total) * 100}%`,
              background: s.color,
              borderRight: i < active.length - 1 ? "1px solid var(--background)" : "none",
            }}
          />
        ))}
      </div>
      {summary && (
        <span className="font-mono text-label font-normal leading-body text-muted-foreground">
          {summary}
        </span>
      )}
    </div>
  );
};

export { SegmentedProgress };
export type { Segment, SegmentedProgressProps };
