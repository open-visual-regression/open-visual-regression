"use client";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { FacetBar } from "@/lib/components/facet/FacetBar";
import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";

import { BuildsAuthorFacetContent } from "./BuildsAuthorFacetContent";
import { BuildsBranchFacetContent } from "./BuildsBranchFacetContent";
import { BuildsCommitFacetContent } from "./BuildsCommitFacetContent";
import { formatCommitSha } from "./formatCommitSha";

type BuildsFiltersProps = {
  projectId?: string;
  projectIds?: string[];
  statuses: BuildStatus[];
  branches: string[];
  authors: string[];
  commitShas: string[];
  statusOptions: FacetOption<BuildStatus>[];
  branchOptions: FacetOption<string>[];
  authorOptions: FacetOption<string>[];
  commitShaOptions: FacetOption<string>[];
  projectOptions?: FacetOption<string>[];
  className?: string;
};

export const BuildsFilters = ({
  projectId,
  projectIds = [],
  statuses,
  branches,
  authors,
  commitShas,
  statusOptions,
  branchOptions,
  authorOptions,
  commitShaOptions,
  projectOptions = [],
  className,
}: BuildsFiltersProps) => (
  <FacetBar
    className={className}
    facets={[
      { param: "project", label: "project", options: projectOptions, selected: projectIds },
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
        formatLabel: formatCommitSha,
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
