"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Popover, PopoverContent } from "@ovr/ui/components/popover";

import { FacetMenuButton, type FacetMenuItem } from "./FacetMenuButton";
import { FacetOptionsList, type FacetOption } from "./FacetOptionsList";
import { FacetTrigger } from "./FacetTrigger";
import { formatFacetValueLabel } from "./formatFacetValueLabel";

export type FacetConfig = {
  param: string;
  label: string;
  options: FacetOption<string>[];
  selected: string[];
};

type ResolvedFacet = FacetConfig & { onApply: (next: string[]) => void };

const FacetPopover = ({ label, options, selected, onApply }: ResolvedFacet) => {
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
        <FacetOptionsList
          options={options}
          selected={selected}
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
  onApply,
}: ResolvedFacet): FacetMenuItem => ({
  key: param,
  label,
  active: selected.length > 0,
  content: (close) => (
    <FacetOptionsList
      options={options}
      selected={selected}
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
