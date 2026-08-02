import { cn } from "@ovr/ui/lib/utils";

import { getSkeletonGridItems } from "@/lib/components/skeleton-grid/getSkeletonGridItems";

const CARD_TIERS = [
  { columns: 1, className: "" },
  { columns: 2, className: "hidden md:block" },
  { columns: 3, className: "hidden lg:block" },
];

export const ProjectsPageSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="h-7 w-32 rounded-sm bg-ovr-border-subtle" />
      <div className="h-8 w-28 rounded-md bg-ovr-border-subtle" />
    </div>
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {getSkeletonGridItems(CARD_TIERS).map(({ key, className }) => (
        <li
          key={key}
          className={cn("h-44 rounded-card border border-ovr-border bg-ovr-elevated", className)}
        />
      ))}
    </ul>
  </div>
);
