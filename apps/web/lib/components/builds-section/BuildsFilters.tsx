"use client";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

import { BuildsAuthorFacetContent } from "./BuildsAuthorFacetContent";
import { BuildsBranchFacetContent } from "./BuildsBranchFacetContent";
import { BuildsCommitFacetContent } from "./BuildsCommitFacetContent";

type BuildsFiltersProps = {
  projectId?: string;
  statuses: BuildStatus[];
  branches: string[];
  authors: string[];
  commitShas: string[];
  statusOptions: FacetOption<BuildStatus>[];
  branchOptions: FacetOption<string>[];
  authorOptions: FacetOption<string>[];
  commitShaOptions: FacetOption<string>[];
  className?: string;
};

export const BuildsFilters = ({
  projectId,
  statuses,
  branches,
  authors,
  commitShas,
  statusOptions,
  branchOptions,
  authorOptions,
  commitShaOptions,
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
        renderContent: ({ selected, onApply, onClear }) => (
          <BuildsBranchFacetContent
            projectId={projectId}
            selected={selected}
            onApply={onApply}
            onClear={onClear}
          />
        ),
      },
      {
        param: "author",
        label: "author",
        options: authorOptions,
        selected: authors,
        renderContent: ({ selected, onApply, onClear }) => (
          <BuildsAuthorFacetContent
            projectId={projectId}
            selected={selected}
            onApply={onApply}
            onClear={onClear}
          />
        ),
      },
      {
        param: "commit",
        label: "commit",
        options: commitShaOptions,
        selected: commitShas,
        renderContent: ({ selected, onApply, onClear }) => (
          <BuildsCommitFacetContent
            projectId={projectId}
            selected={selected}
            onApply={onApply}
            onClear={onClear}
          />
        ),
      },
    ]}
  />
);
