"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList } from "@/lib/components/facet/FacetOptionsList";

import { BuildsAuthorFacet } from "./BuildsAuthorFacet";
import { BuildsAuthorFacetContent } from "./BuildsAuthorFacetContent";
import { BuildsBranchFacet } from "./BuildsBranchFacet";
import { BuildsBranchFacetContent } from "./BuildsBranchFacetContent";
import { BuildsStatusFacet, STATUS_OPTIONS } from "./BuildsStatusFacet";

type BuildsFiltersProps = {
  projectId: string;
  statuses: BuildStatus[];
  branches: string[];
  authors: string[];
  className?: string;
};

export const BuildsFilters = ({
  projectId,
  statuses,
  branches,
  authors,
  className,
}: BuildsFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (key: "status" | "branch" | "author", values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyStatuses = (next: BuildStatus[]) => commit("status", next);
  const applyBranches = (next: string[]) => commit("branch", next);
  const applyAuthors = (next: string[]) => commit("author", next);

  const facets: FacetMenuItem[] = [
    {
      key: "status",
      label: "status",
      active: statuses.length > 0,
      content: (close) => (
        <FacetOptionsList
          options={STATUS_OPTIONS}
          selected={statuses}
          onApply={(next) => {
            applyStatuses(next);
            close();
          }}
          onClear={() => {
            applyStatuses([]);
            close();
          }}
        />
      ),
    },
    {
      key: "branch",
      label: "branch",
      active: branches.length > 0,
      content: (close) => (
        <BuildsBranchFacetContent
          projectId={projectId}
          selected={branches}
          onApply={(next) => {
            applyBranches(next);
            close();
          }}
        />
      ),
    },
    {
      key: "author",
      label: "author",
      active: authors.length > 0,
      content: (close) => (
        <BuildsAuthorFacetContent
          projectId={projectId}
          selected={authors}
          onApply={(next) => {
            applyAuthors(next);
            close();
          }}
        />
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        <BuildsStatusFacet selected={statuses} onApply={applyStatuses} />
        <BuildsBranchFacet projectId={projectId} selected={branches} onApply={applyBranches} />
        <BuildsAuthorFacet projectId={projectId} selected={authors} onApply={applyAuthors} />
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
