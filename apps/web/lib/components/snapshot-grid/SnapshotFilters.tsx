import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type SnapshotFlag } from "@ovr/api/contracts/snapshots";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

type SnapshotFiltersProps = {
  statuses?: SnapshotDisplayStatus[];
  browsers: string[];
  viewports: string[];
  flags: SnapshotFlag[];
  projectIds?: string[];
  statusOptions?: FacetOption<SnapshotDisplayStatus>[];
  browserOptions: FacetOption<string>[];
  viewportOptions: FacetOption<string>[];
  flagOptions: FacetOption<SnapshotFlag>[];
  projectOptions?: FacetOption<string>[];
  className?: string;
};

export const SnapshotFilters = ({
  statuses = [],
  browsers,
  viewports,
  flags,
  projectIds = [],
  statusOptions = [],
  browserOptions,
  viewportOptions,
  flagOptions,
  projectOptions = [],
  className,
}: SnapshotFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "project", label: "project", options: projectOptions, selected: projectIds },
      { param: "status", label: "status", options: statusOptions, selected: statuses },
      { param: "browser", label: "browser", options: browserOptions, selected: browsers },
      { param: "viewport", label: "viewport", options: viewportOptions, selected: viewports },
      { param: "flag", label: "flags", options: flagOptions, selected: flags, minOptions: 1 },
    ]}
  />
);
