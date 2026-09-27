import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { type Role } from "@/lib/auth/roles";

import { ProjectBaselineButton } from "../project-baseline-button/ProjectBaselineButton";
import { ProjectSettingsButton } from "../project-settings-button/ProjectSettingsButton";

export type ProjectHeaderProps = {
  projectId: string;
  projectName: string;
  baselineBuildId: string | null;
  role: Role;
};

export const ProjectHeader = ({
  projectId,
  projectName,
  baselineBuildId,
  role,
}: ProjectHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <Typography variant="h1" as="h1" className="min-w-0 flex-1 truncate">
        {projectName}
      </Typography>
      <ProjectBaselineButton projectId={projectId} baselineBuildId={baselineBuildId} />
      <ProjectSettingsButton projectId={projectId} role={role} />
    </div>
  );
};

export const ProjectHeaderSkeleton = () => (
  <div className="flex items-center gap-3">
    <TypographySkeleton variant="h1" className="min-w-0 flex-1" />
    <Skeleton className="h-7 w-7 rounded-md lg:w-28" />
    <Skeleton className="h-7 w-7 rounded-md lg:w-24" />
  </div>
);
