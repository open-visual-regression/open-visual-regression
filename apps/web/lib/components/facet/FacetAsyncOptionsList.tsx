"use client";

import { useEffect, useState } from "react";

import { Button } from "@ovr/ui/components/button";
import { Checkbox } from "@ovr/ui/components/checkbox";
import { Icon, SearchIcon } from "@ovr/ui/components/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ovr/ui/components/input-group";

import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import { type FacetOption } from "./FacetOptionsList";

type FacetAsyncOptionsListProps<T extends string> = {
  options: FacetOption<T>[];
  selected: T[];
  isLoading: boolean;
  onSearchChange: (search: string) => void;
  onApply: (next: T[]) => void;
  onClear: () => void;
};

export function FacetAsyncOptionsList<T extends string>({
  options,
  selected,
  isLoading,
  onSearchChange,
  onApply,
  onClear,
}: FacetAsyncOptionsListProps<T>) {
  const [draft, setDraft] = useState<T[]>(selected);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  const toggle = (value: T) =>
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  const selectedOptions = selected.map((value) => ({ value, label: value }));
  const resultOptions = options.filter((option) => !selected.includes(option.value));
  const visibleOptions = [...selectedOptions, ...resultOptions];

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <InputGroup>
        <InputGroupInput
          aria-label="search options"
          placeholder="search..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <Icon icon={SearchIcon} />
        </InputGroupAddon>
      </InputGroup>
      <div className="min-w-0 max-h-[var(--available-height,70vh)] overflow-y-auto">
        <div className="flex min-w-0 flex-col gap-0.5 py-2">
          {visibleOptions.map((option) => (
            <label
              key={option.value}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg py-1 hover:bg-ovr-hover"
            >
              <Checkbox
                checked={draft.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              <span className="min-w-0 truncate text-xs">{option.label}</span>
            </label>
          ))}
          {visibleOptions.length === 0 ? (
            <p className="px-1.5 py-1 text-xs text-ovr-fg-tertiary">
              {isLoading ? "loading..." : "no matches"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-ovr-border-subtle pt-2">
        <Button variant="ghost" color="neutral" size="sm" onClick={onClear}>
          clear
        </Button>
        <Button variant="solid" color="accent" size="sm" onClick={() => onApply(draft)}>
          apply
        </Button>
      </div>
    </div>
  );
}
