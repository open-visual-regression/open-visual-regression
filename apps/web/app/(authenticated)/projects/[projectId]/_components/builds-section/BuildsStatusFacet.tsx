"use client";

import { useState } from "react";

import { buildStatusSchema, type BuildStatus } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { FacetOptionsList } from "@/lib/components/Facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/Facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/Facet/formatFacetValueLabel";

export const STATUS_OPTIONS = buildStatusSchema.options.map((status) => ({
  value: status,
  label: getBuildStatusLabel(status),
}));

type BuildsStatusFacetProps = {
  selected: BuildStatus[];
  onApply: (next: BuildStatus[]) => void;
};

export const BuildsStatusFacet = ({ selected, onApply }: BuildsStatusFacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="status"
        valueLabel={formatFacetValueLabel(selected.map((status) => getBuildStatusLabel(status)))}
        active={selected.length > 0}
      />
      <PopoverContent>
        <FacetOptionsList
          options={STATUS_OPTIONS}
          selected={selected}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
          onClear={() => {
            onApply([]);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
