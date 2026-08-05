import Link from "next/link";
import { ComponentProps } from "react";

import { cn } from "@ovr/ui/lib/utils";

import { CardSurface } from "./CardSurface";

type CardLinkProps = ComponentProps<typeof Link>;

export const CardLink = ({ className, ...props }: CardLinkProps) => {
  return (
    <CardSurface
      {...props}
      as={Link}
      className={cn(
        "hover:scale-101",
        "focus-visible:border-ovr-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ovr-accent/35 focus-visible:scale-101",
        className,
      )}
    />
  );
};
