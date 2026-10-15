import type { ComponentProps } from "react";

import { cn } from "@ovr/ui/lib/utils";

export const MetadataList = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("flex flex-row flex-wrap items-center gap-x-4 gap-y-2 text-xs", className)}
    {...props}
  />
);
