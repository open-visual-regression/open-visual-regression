"use client";

import { type SnapshotFlag } from "@ovr/api/contracts/snapshots";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

type BaselineSnapshotsFiltersProps = {
  flags: SnapshotFlag[];
  flagOptions: FacetOption<SnapshotFlag>[];
  className?: string;
};

export const BaselineSnapshotsFilters = ({
  flags,
  flagOptions,
  className,
}: BaselineSnapshotsFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "flag", label: "flags", options: flagOptions, selected: flags, minOptions: 1 },
    ]}
  />
);
