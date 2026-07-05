import { type Browser, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  browsers: Browser[];
  viewports: string[];
  statusOptions: FacetOption<SnapshotDisplayStatus>[];
  browserOptions: FacetOption<Browser>[];
  viewportOptions: FacetOption<string>[];
  className?: string;
};

export const SnapshotFilters = ({
  statuses,
  browsers,
  viewports,
  statusOptions,
  browserOptions,
  viewportOptions,
  className,
}: SnapshotFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "status", label: "status", options: statusOptions, selected: statuses },
      { param: "browser", label: "browser", options: browserOptions, selected: browsers },
      { param: "viewport", label: "viewport", options: viewportOptions, selected: viewports },
    ]}
  />
);
