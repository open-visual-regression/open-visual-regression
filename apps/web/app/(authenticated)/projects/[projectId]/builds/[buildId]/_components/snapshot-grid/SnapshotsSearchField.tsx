import { SearchField } from "@/lib/components/SearchField/SearchField";

type SnapshotsSearchFieldProps = {
  projectId: string;
  buildId: string;
  search?: string;
  className?: string;
};

export const SnapshotsSearchField = ({
  projectId,
  buildId,
  search,
  className,
}: SnapshotsSearchFieldProps) => (
  <SearchField
    action={`/projects/${projectId}/builds/${buildId}`}
    label="search snapshots"
    placeholder="search snapshots..."
    search={search}
    className={className}
  />
);
