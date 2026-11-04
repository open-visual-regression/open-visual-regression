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
    label="search snapshots"
    placeholder="search snapshots..."
    search={search}
    searchParams={searchParams}
    className={className}
  />
);
