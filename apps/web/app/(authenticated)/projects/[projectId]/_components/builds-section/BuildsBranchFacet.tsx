"use client";

import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

import { BuildsBranchFacetContent } from "./BuildsBranchFacetContent";

type BuildsBranchFacetProps = {
  projectId: string;
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsBranchFacet = ({ projectId, selected, onApply }: BuildsBranchFacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label="branch"
        valueLabel={formatFacetValueLabel(selected)}
        active={selected.length > 0}
      />
      <PopoverContent>
        <BuildsBranchFacetContent
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
