import { SearchField } from "@/lib/components/SearchField/SearchField";

type UsersSearchFieldProps = {
  search?: string;
  className?: string;
};

export const UsersSearchField = ({ search, className }: UsersSearchFieldProps) => (
  <SearchField
    action="/settings/users"
    label="Search users"
    placeholder="Search users..."
    search={search}
    className={className}
  />
);
