"use client";

import { useState } from "react";

import { type ViewportFilter } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

const SEARCHABLE_THRESHOLD = 6;

export const toViewportKey = (viewport: ViewportFilter): string =>
  `${viewport.viewportWidth}x${viewport.viewportHeight}`;

export const toViewportLabel = (viewport: ViewportFilter): string =>
  `${viewport.viewportWidth}×${viewport.viewportHeight}`;

type BuildsViewportFacetProps = {
  viewports: ViewportFilter[];
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsViewportFacet = ({ viewports, selected, onApply }: BuildsViewportFacetProps) => {
  const [open, setOpen] = useState(false);

  const options = viewports.map((viewport) => ({
    value: toViewportKey(viewport),
    label: toViewportLabel(viewport),
  }));

  const labelByKey = new Map(options.map((option) => [option.value, option.label]));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="viewport"
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
