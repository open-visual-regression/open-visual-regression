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

const otherParamEntries = (searchParams: Record<string, string | string[] | undefined> = {}) =>
  Object.entries(searchParams).flatMap(([name, value]) => {
    if (name === "search" || value === undefined) {
      return [];
    }
    return (Array.isArray(value) ? value : [value]).map((entry) => [name, entry] as const);
  });

export const SearchField = ({
  action,
  label,
  placeholder = "search...",
  search,
  searchParams,
  className,
}: SearchFieldProps) => {
  const entries = otherParamEntries(searchParams);
  const params = new URLSearchParams();
  entries.forEach(([name, value]) => params.append(name, value));
  const query = params.toString();
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
