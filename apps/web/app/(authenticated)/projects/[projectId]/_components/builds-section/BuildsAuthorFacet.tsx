"use client";

import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

const SEARCHABLE_THRESHOLD = 6;

type BuildsAuthorFacetProps = {
  authors: string[];
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsAuthorFacet = ({ authors, selected, onApply }: BuildsAuthorFacetProps) => {
  const [open, setOpen] = useState(false);

  const options = authors.map((author) => ({ value: author, label: author }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="author"
        valueLabel={formatFacetValueLabel(selected)}
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
