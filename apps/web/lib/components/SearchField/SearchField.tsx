"use client";

import { useState, type FormEvent } from "react";
import { Icon, SearchIcon, XIcon } from "@ovr/ui/components/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ovr/ui/components/input-group";

export type SearchFieldProps = {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  loading?: boolean;
  className?: string;
  onSearchAction: (value: string) => void;
};

export const SearchField = ({
  label,
  placeholder = "search...",
  defaultValue = "",
  loading = false,
  className,
  onSearchAction,
}: SearchFieldProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchAction(value.trim());
  };

  const handleClear = () => {
    setValue("");
    onSearchAction("");
  };

  return (
    <form role="search" className={className} onSubmit={handleSubmit}>
      <InputGroup>
        <InputGroupInput
          aria-label={label}
          placeholder={placeholder}
          value={value}
          disabled={loading}
          onChange={(event) => setValue(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          {value ? (
            <InputGroupButton aria-label="clear search" disabled={loading} onClick={handleClear}>
              <Icon icon={XIcon} />
            </InputGroupButton>
          ) : null}
          <InputGroupButton type="submit" aria-label="search" disabled={loading}>
            <Icon icon={SearchIcon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
};
