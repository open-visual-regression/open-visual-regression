"use client";

import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

import { BuildsAuthorFacetContent } from "./BuildsAuthorFacetContent";

type BuildsAuthorFacetProps = {
  projectId: string;
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsAuthorFacet = ({ projectId, selected, onApply }: BuildsAuthorFacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="author"
        valueLabel={formatFacetValueLabel(selected)}
        active={selected.length > 0}
      />
      <PopoverContent>
        <BuildsAuthorFacetContent
          projectId={projectId}
          selected={selected}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
