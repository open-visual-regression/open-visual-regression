import Link from "next/link";
import { ComponentProps } from "react";

import { cn } from "@ovr/ui/lib/utils";

type CardLinkProps = ComponentProps<typeof Link>;

export const CardLink = ({ className, ...props }: CardLinkProps) => {
  return (
    <Link
      data-slot="card"
      {...props}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-card border border-ovr-border bg-ovr-elevated py-4 text-xs/relaxed text-ovr-fg has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "hover:scale-101",
        "focus-visible:border-ovr-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ovr-accent/35 focus-visible:scale-101",
        className,
      )}
    />
  );
};
