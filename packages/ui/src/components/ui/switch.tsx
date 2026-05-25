import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "../../lib/utils";

const Switch = ({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch relative inline-flex shrink-0 items-center rounded-lg border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent-ring aria-invalid:border-ovr-remove aria-invalid:ring-2 aria-invalid:ring-ovr-remove/30 data-[size=default]:h-4 data-[size=default]:w-7 data-[size=sm]:h-3.25 data-[size=sm]:w-5.5 data-checked:bg-ovr-accent data-checked:border-ovr-accent data-unchecked:bg-ovr-inset data-unchecked:border-ovr-border data-disabled:cursor-not-allowed data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className="pointer-events-none block rounded-thumb ring-0 transition-transform group-data-[size=default]/switch:size-3 group-data-[size=sm]/switch:size-2.25 data-checked:bg-ovr-on-accent data-unchecked:bg-ovr-fg-tertiary group-data-[size=default]/switch:data-checked:translate-x-3 group-data-[size=sm]/switch:data-checked:translate-x-2.25 group-data-[size=default]/switch:data-unchecked:translate-x-0.5 group-data-[size=sm]/switch:data-unchecked:translate-x-0.5"
    />
  </SwitchPrimitive.Root>
);

export { Switch };
