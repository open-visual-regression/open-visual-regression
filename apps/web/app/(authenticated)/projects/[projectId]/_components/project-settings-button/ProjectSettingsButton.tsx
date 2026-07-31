import { Icon, SettingsIcon } from "@ovr/ui/components/icon";

import { type Role } from "@/lib/auth/roles";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

export type ProjectSettingsButtonProps = {
  projectId: string;
  role: Role;
};

export const ProjectSettingsButton = ({ projectId, role }: ProjectSettingsButtonProps) => {
  return (
    <RequiresAdminRole role={role}>
      <ButtonLink href={`/projects/${projectId}/settings`} variant="outline" color="neutral">
        <Icon icon={SettingsIcon} />
        project settings
      </ButtonLink>
    </RequiresAdminRole>
  );
};
