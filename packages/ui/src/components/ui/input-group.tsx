import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";

const InputGroup = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="input-group"
    role="group"
    className={cn(
      "group/input-group flex h-8 w-full min-w-0 items-center rounded-lg border border-ovr-border bg-ovr-elevated transition-colors outline-none",
      "has-[[data-slot=input-group-control]:focus-visible]:border-ovr-accent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ovr-accent-ring",
      "has-[[data-slot=input-group-control][aria-invalid=true]]:border-ovr-remove has-[[data-slot=input-group-control][aria-invalid=true]]:ring-2 has-[[data-slot=input-group-control][aria-invalid=true]]:ring-ovr-remove/30",
      "has-[[data-slot=input-group-control]:disabled]:pointer-events-none has-[[data-slot=input-group-control]:disabled]:opacity-50",
      className,
    )}
    {...props}
  />
);

const inputGroupAddonVariants = cva("flex items-center gap-0.5 text-ovr-fg-muted", {
  variants: {
    align: {
      "inline-start": "order-first pl-1",
      "inline-end": "order-last pr-1",
    },
  },
  defaultVariants: { align: "inline-start" },
});

const InputGroupAddon = ({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) => (
  <div
    data-slot="input-group-addon"
    data-align={align}
    role="group"
    className={cn(inputGroupAddonVariants({ align }), className)}
    {...props}
  />
);

const InputGroupButton = ({
  className,
  type = "button",
  variant = "ghost",
  size = "icon-xs",
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    type={type}
    variant={variant}
    size={size}
    className={cn("rounded-md", className)}
    {...props}
  />
);

const InputGroupInput = ({ className, ...props }: React.ComponentProps<typeof Input>) => (
  <Input
    data-slot="input-group-control"
    className={cn(
      "h-full flex-1 rounded-none border-0 bg-transparent shadow-none outline-none focus-visible:ring-0 aria-invalid:ring-0",
      className,
    )}
    {...props}
  />
);

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };
