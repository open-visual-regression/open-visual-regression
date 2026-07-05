import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { FacetBar } from "@/lib/components/facet/FacetBar";

type SnapshotFiltersProps = {
  statuses: SnapshotDisplayStatus[];
  browsers: string[];
  viewportNames: string[];
  availableStatuses: SnapshotDisplayStatus[];
  availableBrowsers: string[];
  availableViewportNames: string[];
  className?: string;
};

export const SnapshotFilters = ({
  statuses,
  browsers,
  viewportNames,
  availableStatuses,
  availableBrowsers,
  availableViewportNames,
  className,
}: SnapshotFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      {
        param: "status",
        label: "status",
        options: availableStatuses.map((status) => ({
          value: status,
          label: getBuildStatusLabel(status),
        })),
        selected: statuses,
      },
      {
        param: "browser",
        label: "browser",
        options: availableBrowsers.map((browser) => ({ value: browser, label: browser })),
        selected: browsers,
      },
      {
        param: "viewport",
        label: "viewport",
        options: availableViewportNames.map((name) => ({ value: name, label: name })),
        selected: viewportNames,
      },
    ]}
  />
);
