"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FacetAsyncOptionsList } from "@/lib/components/facet/FacetAsyncOptionsList";
import { orpc } from "@/lib/orpc/client";

type BuildsCommitFacetContentProps = {
  projectId?: string;
  selected: string[];
  onApply: (next: string[]) => void;
  onClear: () => void;
};

export const BuildsCommitFacetContent = ({
  projectId,
  selected,
  onApply,
  onClear,
}: BuildsCommitFacetContentProps) => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...orpc.builds.listCommitShas.queryOptions({
      input: { projectId, search: search || undefined },
    }),
    placeholderData: keepPreviousData,
  });

  const options = (data?.commitShas ?? []).map((commitSha) => ({
    value: commitSha,
    label: commitSha.slice(0, 7),
  }));

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
