"use client";

import { useState } from "react";

import { type BuildStatus } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { FacetOptionsList, type FacetOption } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

type BuildsStatusFacetProps = {
  options: FacetOption<BuildStatus>[];
  selected: BuildStatus[];
  onApply: (next: BuildStatus[]) => void;
};

export const BuildsStatusFacet = ({ options, selected, onApply }: BuildsStatusFacetProps) => {
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
          options={options}
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
