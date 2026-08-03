import { ComponentProps, ElementType } from "react";

import { cn } from "@ovr/ui/lib/utils";

type CardSurfaceProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentProps<T>, "as" | "className">;

export const CardSurface = <T extends ElementType = "div">({
  as,
  className,
  ...props
}: CardSurfaceProps<T>) => {
  const Component = as ?? "div";

  return (
    <Component
      data-slot="card"
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-card border border-ovr-border bg-ovr-elevated py-4 text-xs/relaxed text-ovr-fg has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        className,
      )}
      {...props}
    />
  );
};
