import { NavigationBar } from "./NavigationBar";

export const NavigationBarSkeleton = () => (
  <NavigationBar className="animate-pulse flex-row justify-between gap-3">
    <div className="flex min-w-0 flex-row items-center gap-3">
      <div className="size-5 shrink-0 rounded-sm bg-ovr-border-subtle md:hidden" />
      <div className="h-4 w-24 shrink-0 rounded-sm bg-ovr-border-subtle" />
      <div className="hidden h-5 w-px bg-ovr-border md:block" />
      <div className="hidden h-3 w-48 rounded-sm bg-ovr-border-subtle md:block" />
    </div>
    <div className="size-6 shrink-0 rounded-full bg-ovr-border-subtle" />
  </NavigationBar>
);
