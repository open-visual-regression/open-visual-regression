"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";
import { orpc } from "@/lib/orpc/client";

const useBranchSearch = (projectId: string, search: string) => {
  const { data, isLoading } = useQuery({
    ...orpc.builds.listBranches.queryOptions({ input: { projectId, search: search || undefined } }),
    placeholderData: keepPreviousData,
  });

  return {
    options: (data?.branches ?? []).map((branch) => ({ value: branch, label: branch })),
    isLoading,
  };
};

const useAuthorSearch = (projectId: string, search: string) => {
  const { data, isLoading } = useQuery({
    ...orpc.builds.listAuthors.queryOptions({ input: { projectId, search: search || undefined } }),
    placeholderData: keepPreviousData,
  });

  return {
    options: (data?.authors ?? []).map((author) => ({ value: author, label: author })),
    isLoading,
  };
};

type BuildsFiltersProps = {
  projectId: string;
  statuses: BuildStatus[];
  branches: string[];
  authors: string[];
  statusOptions: FacetOption<BuildStatus>[];
  branchOptions: FacetOption<string>[];
  authorOptions: FacetOption<string>[];
  className?: string;
};

export const BuildsFilters = ({
  projectId,
  statuses,
  branches,
  authors,
  statusOptions,
  branchOptions,
  authorOptions,
  className,
}: BuildsFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "status", label: "status", options: statusOptions, selected: statuses },
      {
        param: "branch",
        label: "branch",
        options: branchOptions,
        selected: branches,
        useSearch: (search) => useBranchSearch(projectId, search),
      },
      {
        param: "author",
        label: "author",
        options: authorOptions,
        selected: authors,
        useSearch: (search) => useAuthorSearch(projectId, search),
      },
    ]}
  />
);
