"use client";

import { type SnapshotFlag } from "@ovr/api/contracts/snapshots";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

type BaselineSnapshotsFiltersProps = {
  projectIds: string[];
  flags: SnapshotFlag[];
  projectOptions: FacetOption<string>[];
  flagOptions: FacetOption<SnapshotFlag>[];
  className?: string;
};

export const BaselineSnapshotsFilters = ({
  projectIds,
  flags,
  projectOptions,
  flagOptions,
  className,
}: BaselineSnapshotsFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "project", label: "project", options: projectOptions, selected: projectIds },
      { param: "flag", label: "flags", options: flagOptions, selected: flags, minOptions: 1 },
    ]}
  />
);
