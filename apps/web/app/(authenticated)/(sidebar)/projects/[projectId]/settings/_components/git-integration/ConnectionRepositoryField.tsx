"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, type Control } from "react-hook-form";

import type {
  GitProviderSummarySchema,
  GitRepositorySchema,
} from "@ovr/api/contracts/gitProviders";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "@ovr/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@ovr/ui/components/field";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { orpc } from "@/lib/orpc/client";
import { gitRepositoriesQueryOptions } from "@/lib/orpc/git-repositories-query";

import type { GitIntegrationFormValues } from "./schema";

type ConnectionRepositoryFieldProps = {
  control: Control<GitIntegrationFormValues>;
  provider: GitProviderSummarySchema;
  error: { message?: string } | undefined;
};

const isSameRepository = (a: GitRepositorySchema, b: GitRepositorySchema) =>
  a.connectionId === b.connectionId && a.id === b.id;

const useSearch = (provider: GitProviderSummarySchema, query: string, open: boolean) =>
  useQuery(
    orpc.gitProviders.searchRepositories.queryOptions(
      gitRepositoriesQueryOptions(provider.id, query, open),
    ),
  );

const describeSearch = (
  isFetching: boolean,
  result: ReturnType<typeof useSearch>["data"],
): string | null => {
  if (isFetching) {
    return "searching repositories…";
  }
  if (result?.status === "error") {
    return result.error;
  }
  if (result?.repositories.length === 0) {
    return "no repositories match";
  }
  if (result?.nextCursor) {
    return "showing the first matches, keep typing to narrow them down";
  }
  return null;
};

export const ConnectionRepositoryField = ({
  control,
  provider,
  error,
}: ConnectionRepositoryFieldProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const { data, isFetching } = useSearch(provider, debouncedQuery, open);
  const repositories = data?.status === "ok" ? data.repositories : [];
  const label = provider.connections?.label ?? "connection";

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="repository">repository</FieldLabel>
      <Controller
        control={control}
        name="repository"
        render={({ field }) => (
          <Combobox
            items={repositories}
            filter={null}
            value={field.value}
            onValueChange={(value) => field.onChange(value ?? null)}
            onInputValueChange={setQuery}
            onOpenChange={setOpen}
            itemToStringLabel={(repository: GitRepositorySchema) => repository.fullName}
            isItemEqualToValue={isSameRepository}
          >
            <ComboboxInput
              id="repository"
              placeholder="search repositories"
              aria-invalid={!!error}
            />
            <ComboboxContent>
              <ComboboxStatus>{describeSearch(isFetching, data)}</ComboboxStatus>
              <ComboboxList>
                {(repository: GitRepositorySchema) => (
                  <ComboboxItem
                    key={`${repository.connectionId}:${repository.id}`}
                    value={repository}
                  >
                    {repository.fullName}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      />
      <FieldDescription>
        only repositories the {label} can reach are listed.{" "}
        <ButtonLink href="/settings/integrations" variant="link" color="neutral">
          manage connections
        </ButtonLink>
      </FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
};
