import { SearchField, type SearchFieldProps } from "@/lib/components/SearchField/SearchField";

type SnapshotsSearchFieldProps = {
  action: string;
  search?: string;
  searchParams?: SearchFieldProps["searchParams"];
  className?: string;
};

export const SnapshotsSearchField = ({
  action,
  search,
  searchParams,
  className,
}: SnapshotsSearchFieldProps) => (
  <SearchField
    action={action}
    label="Search snapshots"
    placeholder="Search snapshots..."
    search={search}
    searchParams={searchParams}
    className={className}
  />
);
