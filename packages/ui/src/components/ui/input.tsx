import * as React from "react";

import { cn } from "@/src/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base layout
        "flex h-8 w-full min-w-0 rounded-[2px] border border-ovr-border bg-ovr-elevated px-2.5",
        // Typography
        "font-mono text-[12px] text-ovr-fg",
        // Placeholder
        "placeholder:text-ovr-fg-muted",
        // Interaction
        "outline-none transition-all",
        // Focus
        "focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent/35",
        // Disabled
        "disabled:pointer-events-none disabled:border-ovr-border-subtle disabled:text-ovr-fg-muted",
        // Validation — error
        "aria-invalid:border-ovr-remove aria-invalid:ring-2 aria-invalid:ring-ovr-remove/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
