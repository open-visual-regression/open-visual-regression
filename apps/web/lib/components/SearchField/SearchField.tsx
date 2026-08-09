import Form from "next/form";
import Link from "next/link";

import { Icon, SearchIcon, XIcon } from "@ovr/ui/components/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ovr/ui/components/input-group";
import { Skeleton } from "@ovr/ui/components/skeleton";

export type SearchFieldProps = {
  action: string;
  label: string;
  placeholder?: string;
  search?: string;
  searchParams?: Record<string, string | string[] | undefined>;
  className?: string;
};

const otherParamEntries = (
  searchParams: Record<string, string | string[] | undefined> = {},
): [string, string][] => {
  const { search: _search, ...rest } = searchParams;
  const entries: [string, string][] = [];

  for (const [name, value] of Object.entries(rest)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry !== undefined) {
        entries.push([name, entry]);
      }
    }
  }

  return entries;
};

export const SearchField = ({
  action,
  label,
  placeholder = "search...",
  search,
  searchParams,
  className,
}: SearchFieldProps) => {
  const entries = otherParamEntries(searchParams);
  const query = new URLSearchParams(entries).toString();
  const clearHref = query ? `${action}?${query}` : action;

  return (
    <Form action={action} role="search" className={className}>
      {entries.map(([name, value], index) => (
        <input key={`${name}-${index}`} type="hidden" name={name} value={value} />
      ))}
      <InputGroup>
        <InputGroupInput
          key={search}
          name="search"
          aria-label={label}
          placeholder={placeholder}
          defaultValue={search}
        />
        <InputGroupAddon align="inline-end">
          {search ? (
            <InputGroupButton
              aria-label="clear search"
              render={<Link href={clearHref} />}
              nativeButton={false}
            >
              <Icon icon={XIcon} />
            </InputGroupButton>
          ) : null}
          <InputGroupButton type="submit" aria-label="search">
            <Icon icon={SearchIcon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Form>
  );
};

export const SearchFieldSkeleton = ({ className }: { className?: string }) => (
  <div className={className}>
    <Skeleton className="h-8 w-full rounded-md" />
  </div>
);
