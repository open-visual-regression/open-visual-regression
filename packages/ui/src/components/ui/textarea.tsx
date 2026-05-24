import * as React from "react"

import { cn } from "@/src/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[2px] border border-ovr-border bg-ovr-elevated px-2.5 py-2 text-xs text-ovr-fg transition-colors outline-none placeholder:text-ovr-fg-muted focus-visible:border-ovr-accent focus-visible:ring-[2px] focus-visible:ring-ovr-accent-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-ovr-remove aria-invalid:ring-[2px] aria-invalid:ring-ovr-remove/30 md:text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
