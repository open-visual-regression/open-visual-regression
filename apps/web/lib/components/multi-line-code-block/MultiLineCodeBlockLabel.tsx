import { JSX } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

type MultiLineCodeBlockLabelProps = JSX.IntrinsicElements["span"];

export const MultiLineCodeBlockLabel = ({
  className,
  children,
  ...props
}: MultiLineCodeBlockLabelProps) => (
  <Typography
    as="span"
    variant="label"
    {...props}
    className={cn("shrink-0 text-ovr-fg-tertiary", className)}
  >
    {children}
  </Typography>
);
