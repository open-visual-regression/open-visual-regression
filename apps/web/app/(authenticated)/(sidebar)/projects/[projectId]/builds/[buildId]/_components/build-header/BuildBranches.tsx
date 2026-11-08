import { type BuildDetailSchema } from "@ovr/api/contracts/builds";
import { ArrowLeftIcon, GitBranchIcon, Icon } from "@ovr/ui/components/icon";

import { GitPill } from "./GitPill";

export type BuildBranchesProps = {
  build: Pick<
    BuildDetailSchema,
    "project" | "branch" | "branchUrl" | "mainBranch" | "mainBranchUrl" | "baseBuild"
  >;
};

// Like a pull request's base and head branches: a branch build shows the main-branch build
// it was compared against, then its own branch.
export const BuildBranches = ({ build }: BuildBranchesProps) => {
  const branchPill = (
    <GitPill
      icon={GitBranchIcon}
      href={build.branchUrl}
      external
      className="max-w-full md:max-w-[32ch]"
    >
      <span className="truncate">{build.branch}</span>
    </GitPill>
  );

  if (build.branch === build.mainBranch) {
    return branchPill;
  }

  const base = build.baseBuild
    ? `${build.mainBranch} @ ${build.baseBuild.commitSha.slice(0, 7)}`
    : `${build.mainBranch} (latest)`;

  return (
    <div
      role="group"
      aria-label={`${build.branch} compared to ${base}`}
      className="flex min-w-0 basis-full items-center gap-1.5 md:basis-auto"
    >
      {build.baseBuild ? (
        <GitPill
          icon={GitBranchIcon}
          href={`/projects/${build.project.id}/builds/${build.baseBuild.id}`}
          className="shrink-0"
        >
          {base}
        </GitPill>
      ) : (
        <GitPill
          icon={GitBranchIcon}
          href={build.mainBranchUrl}
          external
          title={`No ${build.mainBranch} build was found at this branch's merge base, so it's compared to ${build.mainBranch}'s latest baselines`}
          className="shrink-0"
        >
          {base}
        </GitPill>
      )}
      <Icon icon={ArrowLeftIcon} size={10} className="shrink-0 text-ovr-fg-secondary" />
      {branchPill}
    </div>
  );
};
