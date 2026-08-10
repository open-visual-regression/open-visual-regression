import { Skeleton } from "@ovr/ui/components/skeleton";

import { NavigationBar } from "./NavigationBar";

export const NavigationBarSkeleton = () => (
  <NavigationBar className="flex flex-row justify-between gap-3">
    <div className="flex min-w-0 flex-row items-center gap-3">
      <Skeleton className="size-7 shrink-0 md:hidden" />
      <Skeleton className="h-4.5 w-16 shrink-0" />
      <div className="hidden h-5 w-px shrink-0 bg-ovr-border md:block" />
      <Skeleton className="hidden h-3 w-48 md:block" />
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <Skeleton className="size-7" />
    </div>
  </NavigationBar>
);
