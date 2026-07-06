"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetAsyncOptionsList } from "./FacetAsyncOptionsList";
import { FacetMenuButton, type FacetMenuItem } from "./FacetMenuButton";
import { FacetOptionsList, type FacetOption } from "./FacetOptionsList";
import { FacetTrigger } from "./FacetTrigger";
import { formatFacetValueLabel } from "./formatFacetValueLabel";

export type FacetSearchResult = {
  options: FacetOption<string>[];
  isLoading: boolean;
};

export type FacetConfig = {
  param: string;
  label: string;
  // Bounded set of options loaded up front. Also powers the hide-when-<=1 check,
  // so async facets still pass a first page here even though the popover searches.
  options: FacetOption<string>[];
  selected: string[];
  // When provided, the popover searches options against the server instead of
  // filtering the up-front list client-side (for facets that can be large).
  useSearch?: (search: string) => FacetSearchResult;
};

type ResolvedFacet = FacetConfig & { onApply: (next: string[]) => void };

const FacetAsyncBody = ({
  useSearch,
  selected,
  onApply,
  onClear,
}: {
  useSearch: (search: string) => FacetSearchResult;
  selected: string[];
  onApply: (next: string[]) => void;
  onClear: () => void;
}) => {
  const [search, setSearch] = useState("");
  const { options, isLoading } = useSearch(search);

  return (
    <FacetAsyncOptionsList
      options={options}
      selected={selected}
      isLoading={isLoading}
      onSearchChange={setSearch}
      onApply={onApply}
      onClear={onClear}
    />
  );
};

const FacetBody = ({
  options,
  selected,
  useSearch,
  onApply,
  onClear,
}: {
  options: FacetOption<string>[];
  selected: string[];
  useSearch?: (search: string) => FacetSearchResult;
  onApply: (next: string[]) => void;
  onClear: () => void;
}) =>
  useSearch ? (
    <FacetAsyncBody useSearch={useSearch} selected={selected} onApply={onApply} onClear={onClear} />
  ) : (
    <FacetOptionsList options={options} selected={selected} onApply={onApply} onClear={onClear} />
  );

const FacetPopover = ({ label, options, selected, useSearch, onApply }: ResolvedFacet) => {
  const [open, setOpen] = useState(false);
  const labelByValue = new Map(options.map((option) => [option.value, option.label]));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FacetTrigger
        label={label}
        valueLabel={formatFacetValueLabel(
          selected.map((value) => labelByValue.get(value) ?? value),
        )}
        active={selected.length > 0}
      />
      <PopoverContent>
        <FacetBody
          options={options}
          selected={selected}
          useSearch={useSearch}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
          onClear={() => {
            onApply([]);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const toMenuItem = ({
  param,
  label,
  options,
  selected,
  useSearch,
  onApply,
}: ResolvedFacet): FacetMenuItem => ({
  key: param,
  label,
  active: selected.length > 0,
  content: (close) => (
    <FacetBody
      options={options}
      selected={selected}
      useSearch={useSearch}
      onApply={(next) => {
        onApply(next);
        close();
      }}
      onClear={() => {
        onApply([]);
        close();
      }}
    />
  ),
});

type FacetBarProps = {
  facets: FacetConfig[];
  className?: string;
};

export const FacetBar = ({ facets, className }: FacetBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (param: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    values.forEach((value) => params.append(param, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const visibleFacets = facets
    .filter((facet) => facet.options.length > 1)
    .map((facet) => ({ ...facet, onApply: (next: string[]) => commit(facet.param, next) }));

  if (visibleFacets.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        {visibleFacets.map((facet) => (
          <FacetPopover key={facet.param} {...facet} />
        ))}
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={visibleFacets.map(toMenuItem)} />
      </div>
    </div>
  );
};
