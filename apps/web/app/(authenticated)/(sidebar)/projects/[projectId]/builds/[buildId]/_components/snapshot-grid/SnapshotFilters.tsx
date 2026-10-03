import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type SnapshotFlag } from "@ovr/api/contracts/snapshots";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  browsers: string[];
  viewports: string[];
  flags: SnapshotFlag[];
  statusOptions: FacetOption<SnapshotDisplayStatus>[];
  browserOptions: FacetOption<string>[];
  viewportOptions: FacetOption<string>[];
  flagOptions: FacetOption<SnapshotFlag>[];
  className?: string;
};

export const SnapshotFilters = ({
  statuses,
  browsers,
  viewports,
  flags,
  statusOptions,
  browserOptions,
  viewportOptions,
  flagOptions,
  className,
}: SnapshotFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "status", label: "status", options: statusOptions, selected: statuses },
      { param: "browser", label: "browser", options: browserOptions, selected: browsers },
      { param: "viewport", label: "viewport", options: viewportOptions, selected: viewports },
      { param: "flag", label: "flags", options: flagOptions, selected: flags, minOptions: 1 },
    ]}
  />
);
