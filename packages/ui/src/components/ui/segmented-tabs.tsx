"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "../../lib/utils";

const SegmentedTabs = ({ className, ...props }: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root data-slot="segmented-tabs" className={cn("w-fit", className)} {...props} />
);

const SegmentedTabsList = ({ className, ...props }: TabsPrimitive.List.Props) => (
  <TabsPrimitive.List
    data-slot="segmented-tabs-list"
    className={cn(
      "inline-flex w-fit items-center overflow-hidden rounded-lg border border-ovr-border bg-ovr-elevated",
      className,
    )}
    {...props}
  />
);

const SegmentedTabsTrigger = ({ className, ...props }: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    data-slot="segmented-tabs-trigger"
    className={cn(
      "inline-flex h-7 cursor-pointer items-center gap-1.5 px-2.5 text-[11px] font-medium whitespace-nowrap text-ovr-fg-secondary transition-colors outline-none",
      "border-l border-ovr-border first:border-l-0",
      "hover:text-ovr-fg",
      "data-active:bg-ovr-active data-active:text-ovr-fg",
      "focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ovr-accent-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
      className,
    )}
    {...props}
  />
);

export { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger };
