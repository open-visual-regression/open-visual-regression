import * as React from "react";

import { cn } from "@/src/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base layout
        "flex min-h-[80px] w-full rounded-[2px] border border-ovr-border bg-ovr-elevated px-2.5 py-2",
        // Typography
        "font-mono text-[12px] leading-[1.5] text-ovr-fg",
        // Placeholder
        "placeholder:text-ovr-fg-muted",
        // Resize & interaction
        "resize-y outline-none transition-all",
        // Focus
        "focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent/35",
        // Disabled
        "disabled:pointer-events-none disabled:resize-none disabled:border-ovr-border-subtle disabled:text-ovr-fg-muted",
        // Validation — error
        "aria-invalid:border-ovr-remove aria-invalid:ring-2 aria-invalid:ring-ovr-remove/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
