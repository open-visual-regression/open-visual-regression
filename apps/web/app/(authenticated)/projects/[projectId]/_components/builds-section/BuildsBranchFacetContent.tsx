"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FacetAsyncOptionsList } from "@/lib/components/facet/FacetAsyncOptionsList";
import { orpc } from "@/lib/orpc/client";

type BuildsBranchFacetContentProps = {
  projectId: string;
  selected: string[];
  onApply: (next: string[]) => void;
  onClear: () => void;
};

export const BuildsBranchFacetContent = ({
  projectId,
  selected,
  onApply,
  onClear,
}: BuildsBranchFacetContentProps) => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...orpc.builds.listBranches.queryOptions({
      input: { projectId, search: search || undefined },
    }),
    placeholderData: keepPreviousData,
  });

  const options = (data?.branches ?? []).map((branch) => ({ value: branch, label: branch }));

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
