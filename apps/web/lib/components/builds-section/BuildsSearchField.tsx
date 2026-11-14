import { SearchField, type SearchFieldProps } from "@/lib/components/SearchField/SearchField";

type BuildsSearchFieldProps = {
  projectId?: string;
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
    action={projectId ? `/projects/${projectId}` : "/builds"}
    label="Search builds"
    placeholder="Search builds..."
    search={search}
    searchParams={searchParams}
    className={className}
  />
);
