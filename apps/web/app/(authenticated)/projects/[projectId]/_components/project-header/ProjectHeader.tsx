import { Typography } from "@ovr/ui/components/typography";

import { type Role } from "@/lib/auth/roles";

import { ProjectSettingsButton } from "../project-settings-button/ProjectSettingsButton";

export type ProjectHeaderProps = {
  projectId: string;
  projectName: string;
  role: Role;
};

export const ProjectHeader = ({ projectId, projectName, role }: ProjectHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <Typography variant="h1" as="h1" className="min-w-0 flex-1 truncate">
        {projectName}
      </Typography>
      <ProjectSettingsButton projectId={projectId} role={role} />
    </div>
  );
};
