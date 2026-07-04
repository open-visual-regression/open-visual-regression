import { Button } from "@ovr/ui/components/button";
import { Icon, ChevronDownIcon } from "@ovr/ui/components/icon";
import { PopoverTrigger } from "@ovr/ui/components/popover";

type FacetTriggerProps = {
  label: string;
  valueLabel: string;
  active: boolean;
};

export const FacetTrigger = ({ label, valueLabel, active }: FacetTriggerProps) => (
  <PopoverTrigger
    render={
      <Button
        variant="outline"
        color={active ? "accent" : "neutral"}
        aria-pressed={active}
        aria-label={`${label} ${valueLabel}`}
        className="h-auto max-w-48 min-w-0 flex-row items-center gap-3 py-1.5"
      />
    }
  >
    <span className="text-badge font-semibold tracking-label text-ovr-fg-tertiary uppercase">
      {label}
    </span>
    <span className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 flex-1 truncate text-left">{valueLabel}</span>
      <Icon icon={ChevronDownIcon} size={12} className="shrink-0" />
    </span>
  </PopoverTrigger>
);
