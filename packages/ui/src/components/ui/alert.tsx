import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 overflow-hidden rounded-[2px] border border-l-[3px] px-3 py-2.5 text-left text-xs has-data-[slot=alert-action]:pr-20 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:size-[13px] *:[svg]:translate-y-px *:[svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-ovr-accent    bg-ovr-accent-dim         text-ovr-accent",
        warning: "border-ovr-status-pending bg-ovr-status-pending-dim text-ovr-status-pending",
        success: "border-ovr-diff-add  bg-ovr-diff-add-dim       text-ovr-diff-add",
        destructive: "border-ovr-remove    bg-ovr-diff-remove-dim    text-ovr-remove",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold text-current group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
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
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-[calc(--spacing(1.5))] right-[calc(--spacing(1.5))]", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
