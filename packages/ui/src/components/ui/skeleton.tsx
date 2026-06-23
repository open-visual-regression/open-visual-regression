import { cn } from "../../lib/utils";

export type SkeletonProps = React.ComponentProps<"div"> & {
  label?: string;
};

const Skeleton = ({ className, label = "loading", ...props }: SkeletonProps) => (
  <div
    data-slot="skeleton"
    role="status"
    aria-label={label}
    className={cn("animate-pulse rounded-sm bg-ovr-border-subtle", className)}
    {...props}
  />
);

export { Skeleton };
