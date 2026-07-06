"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetMenuButton, type FacetMenuItem } from "@/lib/components/facet/FacetMenuButton";
import { FacetOptionsList, type FacetOption } from "@/lib/components/facet/FacetOptionsList";

import { BuildsAuthorFacet } from "./BuildsAuthorFacet";
import { BuildsAuthorFacetContent } from "./BuildsAuthorFacetContent";
import { BuildsBranchFacet } from "./BuildsBranchFacet";
import { BuildsBranchFacetContent } from "./BuildsBranchFacetContent";
import { BuildsStatusFacet } from "./BuildsStatusFacet";

type BuildsFiltersProps = {
  projectId: string;
  statuses: BuildStatus[];
  branches: string[];
  authors: string[];
  statusOptions: FacetOption<BuildStatus>[];
  branchOptions: string[];
  authorOptions: string[];
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

  const showStatusFacet = statusOptions.length > 1;
  const showBranchFacet = branchOptions.length > 1;
  const showAuthorFacet = authorOptions.length > 1;

  const statusFacet: FacetMenuItem | null = showStatusFacet
    ? {
        key: "status",
        label: "status",
        active: statuses.length > 0,
        content: (close) => (
          <FacetOptionsList
            options={statusOptions}
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
      }
    : null;

  const branchFacet: FacetMenuItem | null = showBranchFacet
    ? {
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
      }
    : null;

  const authorFacet: FacetMenuItem | null = showAuthorFacet
    ? {
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
      }
    : null;

  const facets = [statusFacet, branchFacet, authorFacet].filter(
    (facet): facet is FacetMenuItem => facet !== null,
  );

  if (facets.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="hidden items-center gap-2 lg:flex">
        {showStatusFacet ? (
          <BuildsStatusFacet options={statusOptions} selected={statuses} onApply={applyStatuses} />
        ) : null}
        {showBranchFacet ? (
          <BuildsBranchFacet projectId={projectId} selected={branches} onApply={applyBranches} />
        ) : null}
        {showAuthorFacet ? (
          <BuildsAuthorFacet projectId={projectId} selected={authors} onApply={applyAuthors} />
        ) : null}
      </div>
      <div className="lg:hidden">
        <FacetMenuButton facets={facets} />
      </div>
    </div>
  );
};
