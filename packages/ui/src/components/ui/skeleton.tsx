import { cn } from "../../lib/utils";

const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("animate-pulse rounded-sm bg-ovr-border-subtle", className)}
    {...props}
  />
);

export { Skeleton };
