import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

export type ProjectHeaderProps = {
  projectId: string;
  projectName: string;
  role: string | null | undefined;
};

export const ProjectHeader = ({ projectId, projectName, role }: ProjectHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Typography variant="h1" as="h1" className="w-full min-w-0 truncate md:w-auto md:flex-1">
        {projectName}
      </Typography>
      <RequiresAdminRole role={role}>
        <ButtonLink href={`/projects/${projectId}/settings`} variant="outline" color="neutral">
          <Icon icon={SettingsIcon} />
          project settings
        </ButtonLink>
      </RequiresAdminRole>
    </div>
  );
};
