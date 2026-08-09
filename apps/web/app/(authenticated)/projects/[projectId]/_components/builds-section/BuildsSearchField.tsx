import { SearchField, type SearchFieldProps } from "@/lib/components/SearchField/SearchField";

type BuildsSearchFieldProps = {
  projectId: string;
  search?: string;
  searchParams?: SearchFieldProps["searchParams"];
  className?: string;
};

export const BuildsSearchField = ({
  projectId,
  search,
  searchParams,
  className,
}: BuildsSearchFieldProps) => (
  <SearchField
    action={`/projects/${projectId}`}
    label="search builds"
    placeholder="search builds..."
    search={search}
    searchParams={searchParams}
    className={className}
  />
);
