"use client";

import { useState } from "react";

import { snapshotDisplayStatusSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";
import { FacetTrigger } from "@/lib/components/facet/FacetTrigger";
import { formatFacetValueLabel } from "@/lib/components/facet/formatFacetValueLabel";

export const STATUS_OPTIONS = snapshotDisplayStatusSchema.options.map((status) => ({
  value: status,
  label: getBuildStatusLabel(status),
}));

type SnapshotStatusFacetProps = {
  selected: SnapshotDisplayStatus[];
  onApply: (next: SnapshotDisplayStatus[]) => void;
};

export const SnapshotStatusFacet = ({ selected, onApply }: SnapshotStatusFacetProps) => {
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
