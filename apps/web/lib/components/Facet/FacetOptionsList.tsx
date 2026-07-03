"use client";

import { useState } from "react";

import { Button } from "@ovr/ui/components/button";
import { Checkbox } from "@ovr/ui/components/checkbox";
import { Icon, SearchIcon } from "@ovr/ui/components/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ovr/ui/components/input-group";

export type FacetOption = {
  value: string;
  label: string;
};

type FacetOptionsListProps = {
  options: FacetOption[];
  selected: string[];
  searchable?: boolean;
  onApply: (next: string[]) => void;
  onClear: () => void;
};

export const FacetOptionsList = ({
  options,
  selected,
  searchable = false,
  onApply,
  onClear,
}: FacetOptionsListProps) => {
  const [draft, setDraft] = useState(selected);
  const [query, setQuery] = useState("");

  const visibleOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (value: string) =>
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  return (
    <div className="flex flex-col gap-2">
      {searchable ? (
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
      ) : null}
      <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
        {visibleOptions.map((option) => (
          <label
            key={option.value}
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ovr-hover"
          >
            <Checkbox
              checked={draft.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
            />
            <span className="min-w-0 truncate text-xs">{option.label}</span>
          </label>
        ))}
        {visibleOptions.length === 0 ? (
          <p className="px-1.5 py-1 text-xs text-ovr-fg-tertiary">no matches</p>
        ) : null}
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
};
