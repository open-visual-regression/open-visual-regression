import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/src/lib/utils";

const typographyVariants = cva("font-mono", {
  variants: {
    variant: {
      display: "text-[56px] font-medium tracking-[-0.03em] leading-[1.15]",
      h1: "text-[28px] font-medium tracking-[-0.02em] leading-[1.15]",
      h2: "text-[20px] font-medium tracking-[-0.02em] leading-[1.35]",
      h3: "text-[16px] font-semibold leading-[1.35]",
      body: "text-[13px] font-normal leading-[1.5]",
      "body-sm": "text-[12px] font-normal leading-[1.5]",
      caption: "text-[11px] font-normal leading-[1.5] text-muted-foreground",
      label: "text-[11px] font-semibold tracking-[0.08em] uppercase text-ovr-fg-secondary",
      code: "text-[13px] [font-feature-settings:'calt'_0,'liga'_0]",
      num: "[font-variant-numeric:tabular-nums]",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

function Typography({ as: Component = "span", variant, className, ...props }: TypographyProps) {
  return (
    <Component
      data-slot="typography"
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
