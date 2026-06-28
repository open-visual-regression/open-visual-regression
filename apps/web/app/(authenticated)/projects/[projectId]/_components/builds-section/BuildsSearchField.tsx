import { SearchField } from "@/lib/components/SearchField/SearchField";

type BuildsSearchFieldProps = {
  projectId: string;
  search?: string;
  className?: string;
};

export const BuildsSearchField = ({ projectId, search, className }: BuildsSearchFieldProps) => (
  <SearchField
    action={`/projects/${projectId}`}
    label="search builds"
    placeholder="search builds..."
    search={search}
    className={className}
  />
);
