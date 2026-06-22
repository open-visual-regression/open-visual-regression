import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { JSX } from "react";

type MultiLineCodeBlockEyebrowProps = JSX.IntrinsicElements["span"];

export const MultiLineCodeBlockEyebrow = ({
  className,
  children,
  ...props
}: MultiLineCodeBlockEyebrowProps) => (
  <Typography
    as="span"
    variant="label"
    {...props}
    className={cn("shrink-0 text-ovr-fg-tertiary", className)}
  >
    {children}
  </Typography>
);
