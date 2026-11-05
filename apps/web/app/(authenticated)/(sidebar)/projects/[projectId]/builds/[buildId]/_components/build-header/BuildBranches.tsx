import Link from "next/link";
import { type ReactNode } from "react";

import { type BuildDetailSchema } from "@ovr/api/contracts/builds";
import { ArrowLeftIcon, GitBranchIcon, Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

export type BuildBranchesProps = {
  build: Pick<BuildDetailSchema, "project" | "branch" | "branchUrl" | "mainBranch" | "baseBuild">;
};

const pillClassName =
  "inline-flex min-w-0 items-center gap-1 rounded-md border border-ovr-border-subtle bg-ovr-elevated px-1.5 py-0.5 font-mono text-xs";

const linkClassName = "hover:border-ovr-border hover:text-ovr-fg focus-visible:outline-2";

type BranchPillProps = {
  href: string | null;
  external?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
};

const BranchPill = ({ href, external = false, title, className, children }: BranchPillProps) => {
  const content = (
    <>
      <Icon icon={GitBranchIcon} size={10} className="shrink-0" />
      {children}
    </>
  );

  if (!href) {
    return (
      <span className={cn(pillClassName, className)} title={title}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      className={cn(pillClassName, linkClassName, className)}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {content}
    </Link>
  );
};

// Like a pull request's base and head branches: a branch build shows the main-branch build
// it was compared against, then its own branch.
export const BuildBranches = ({ build }: BuildBranchesProps) => {
  const branchPill = (
    <BranchPill href={build.branchUrl} external className="max-w-full md:max-w-[32ch]">
      <span className="truncate">{build.branch}</span>
    </BranchPill>
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
      <BranchPill
        href={build.baseBuild ? `/projects/${build.project.id}/builds/${build.baseBuild.id}` : null}
        title={
          build.baseBuild
            ? undefined
            : `No ${build.mainBranch} build was found at this branch's merge base, so it's compared to ${build.mainBranch}'s latest baselines`
        }
        className="shrink-0"
      >
        {base}
      </BranchPill>
      <Icon icon={ArrowLeftIcon} size={10} className="shrink-0 text-ovr-fg-secondary" />
      {branchPill}
    </div>
  );
};
