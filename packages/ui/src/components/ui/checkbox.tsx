import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "../../lib/utils";
import { CheckIcon } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-3.5 shrink-0 items-center justify-center rounded-lg border border-ovr-border bg-ovr-elevated transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent-ring disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50 aria-invalid:border-ovr-remove aria-invalid:ring-2 aria-invalid:ring-ovr-remove/30 data-checked:border-ovr-accent data-checked:bg-ovr-accent data-checked:text-ovr-on-accent",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-2.5"
      >
        <CheckIcon strokeWidth={3} strokeLinecap="square" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
