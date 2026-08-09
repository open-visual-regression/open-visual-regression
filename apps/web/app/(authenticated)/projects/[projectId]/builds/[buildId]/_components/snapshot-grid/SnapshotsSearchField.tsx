import { SearchField, type SearchFieldProps } from "@/lib/components/SearchField/SearchField";

type SnapshotsSearchFieldProps = {
  projectId: string;
  buildId: string;
  search?: string;
  searchParams?: SearchFieldProps["searchParams"];
  className?: string;
};

export const SnapshotsSearchField = ({
  projectId,
  buildId,
  search,
  searchParams,
  className,
}: SnapshotsSearchFieldProps) => (
  <SearchField
    action={`/projects/${projectId}/builds/${buildId}`}
    label="search snapshots"
    placeholder="search snapshots..."
    search={search}
    searchParams={searchParams}
    className={className}
  />
);
