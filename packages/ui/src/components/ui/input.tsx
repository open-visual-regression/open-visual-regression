import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/src/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-[2px] border border-ovr-border bg-ovr-elevated text-xs text-ovr-fg transition-colors outline-none placeholder:text-ovr-fg-muted focus-visible:border-ovr-accent focus-visible:ring-[2px] focus-visible:ring-ovr-accent-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-ovr-remove aria-invalid:ring-[2px] aria-invalid:ring-ovr-remove/30 md:text-xs",
        type === "file"
          ? "p-0 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-ovr-border file:bg-ovr-raised file:px-2.5 file:text-xs file:font-medium file:text-ovr-fg file:mr-2.5 hover:file:bg-ovr-hover"
          : "px-2.5 py-1",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
