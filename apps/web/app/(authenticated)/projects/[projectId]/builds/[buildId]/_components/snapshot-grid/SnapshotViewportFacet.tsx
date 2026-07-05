"use client";

import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList, type FacetOption } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

type SnapshotViewportFacetProps = {
  options: FacetOption<string>[];
  selected: string[];
  onApply: (next: string[]) => void;
};

export const SnapshotViewportFacet = ({
  options,
  selected,
  onApply,
}: SnapshotViewportFacetProps) => {
  const [open, setOpen] = useState(false);
  const labelByValue = new Map(options.map((option) => [option.value, option.label]));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="viewport"
        valueLabel={formatFacetValueLabel(
          selected.map((value) => labelByValue.get(value) ?? value),
        )}
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
