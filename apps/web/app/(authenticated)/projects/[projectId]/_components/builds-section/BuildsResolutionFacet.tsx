"use client";

import { useState } from "react";

import { type ResolutionFilter } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList } from "@/lib/components/Facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/Facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/Facet/formatFacetValueLabel";

const SEARCHABLE_THRESHOLD = 6;

export const toResolutionKey = (resolution: ResolutionFilter): string =>
  `${resolution.viewportWidth}x${resolution.viewportHeight}`;

export const toResolutionLabel = (resolution: ResolutionFilter): string =>
  `${resolution.viewportWidth}×${resolution.viewportHeight}`;

type BuildsResolutionFacetProps = {
  resolutions: ResolutionFilter[];
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsResolutionFacet = ({
  resolutions,
  selected,
  onApply,
}: BuildsResolutionFacetProps) => {
  const [open, setOpen] = useState(false);

  const options = resolutions.map((resolution) => ({
    value: toResolutionKey(resolution),
    label: toResolutionLabel(resolution),
  }));

  const labelByKey = new Map(options.map((option) => [option.value, option.label]));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="resolution"
        valueLabel={formatFacetValueLabel(selected.map((key) => labelByKey.get(key) ?? key))}
        active={selected.length > 0}
      />
      <PopoverContent>
        <FacetOptionsList
          options={options}
          selected={selected}
          searchable={options.length > SEARCHABLE_THRESHOLD}
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
