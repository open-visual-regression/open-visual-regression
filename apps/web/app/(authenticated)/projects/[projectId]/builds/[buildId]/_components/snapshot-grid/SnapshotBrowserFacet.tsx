"use client";

import { useState } from "react";

import { browserSchema, type Browser } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

export const BROWSER_OPTIONS = browserSchema.options.map((browser) => ({
  value: browser,
  label: browser,
}));

type SnapshotBrowserFacetProps = {
  selected: Browser[];
  onApply: (next: Browser[]) => void;
};

export const SnapshotBrowserFacet = ({ selected, onApply }: SnapshotBrowserFacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="browser"
        valueLabel={formatFacetValueLabel(selected)}
        active={selected.length > 0}
      />
      <PopoverContent>
        <FacetOptionsList
          options={BROWSER_OPTIONS}
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
