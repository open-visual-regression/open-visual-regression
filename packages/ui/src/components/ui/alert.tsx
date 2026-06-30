import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 overflow-hidden rounded-lg border border-l-3 px-3 py-2.5 text-left text-xs has-data-[slot=alert-action]:pr-20 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:size-3.25 *:[svg]:translate-y-px *:[svg]:text-current",
  {
    variants: {
      color: {
        accent: "border-ovr-accent bg-ovr-accent-dim text-ovr-accent",
        red: "border-ovr-red bg-ovr-red-dim text-ovr-red",
        green: "border-ovr-green bg-ovr-green-dim text-ovr-green",
        blue: "border-ovr-blue bg-ovr-blue-dim text-ovr-blue",
        amber: "border-ovr-amber bg-ovr-amber-dim text-ovr-amber",
      },
    },
    defaultVariants: {
      color: "accent",
    },
  },
);

const Alert = ({
  className,
  color,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) => {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ color }), className)}
      {...props}
    />
  );
};

const AlertTitle = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold text-current group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  );
};

const AlertDescription = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs/relaxed text-ovr-fg-secondary group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-ovr-fg",
        className,
      )}
      {...props}
    />
  );
};

const AlertAction = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1.5 right-1.5", className)}
      {...props}
    />
  );
};

export { Alert, AlertTitle, AlertDescription, AlertAction };
