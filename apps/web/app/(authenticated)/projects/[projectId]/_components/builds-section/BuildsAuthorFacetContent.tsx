"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FacetAsyncOptionsList } from "@/lib/components/facet/FacetAsyncOptionsList";
import { orpc } from "@/lib/orpc/client";

type BuildsAuthorFacetContentProps = {
  projectId: string;
  selected: string[];
  onApply: (next: string[]) => void;
};

export const BuildsAuthorFacetContent = ({
  projectId,
  selected,
  onApply,
}: BuildsAuthorFacetContentProps) => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...orpc.builds.listAuthors.queryOptions({
      input: { projectId, search: search || undefined },
    }),
    placeholderData: keepPreviousData,
  });

  const options = (data?.authors ?? []).map((author) => ({ value: author, label: author }));

  return (
    <FacetAsyncOptionsList
      options={options}
      selected={selected}
      isLoading={isLoading}
      onSearchChange={setSearch}
      onApply={onApply}
      onClear={() => onApply([])}
    />
  );
};
