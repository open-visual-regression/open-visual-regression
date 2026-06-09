import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const typographyVariants = cva("font-mono", {
  variants: {
    variant: {
      display: "text-display font-medium tracking-display leading-display",
      h1: "text-h1 font-medium tracking-h1 leading-display",
      h2: "text-xl font-medium tracking-h1 leading-heading",
      h3: "text-base font-semibold leading-heading",
      body: "text-body font-normal leading-body",
      "body-muted": "text-body font-normal leading-body text-muted-foreground",
      "body-sm": "text-xs font-normal leading-body",
      caption: "text-label font-normal leading-body text-muted-foreground",
      label: "text-label font-semibold tracking-label uppercase text-ovr-fg-secondary",
      code: "text-body [font-feature-settings:'calt'_0,'liga'_0]",
      num: "tabular-nums",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type TypographyProps = {
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants>;

const Typography = ({ as: Component = "span", variant, className, ...props }: TypographyProps) => {
  return (
    <Component
      data-slot="typography"
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    />
  );
};

export { Typography, typographyVariants };
