import { JSX } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

type MultiLineCodeBlockFilenameProps = JSX.IntrinsicElements["span"];

export const MultiLineCodeBlockFilename = ({
  className,
  children,
  ...props
}: MultiLineCodeBlockFilenameProps) => (
  <Typography
    as="span"
    variant="body-sm"
    {...props}
    className={cn("truncate text-ovr-fg-tertiary", className)}
  >
    {children}
  </Typography>
);
