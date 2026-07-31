import { SettingsIcon } from "@ovr/ui/components/icon";

import { type Role } from "@/lib/auth/roles";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

export type ProjectSettingsButtonProps = {
  projectId: string;
  role: Role;
};

export const ProjectSettingsButton = ({ projectId, role }: ProjectSettingsButtonProps) => {
  return (
    <RequiresAdminRole role={role}>
      <ResponsiveActionButton href={`/projects/${projectId}/settings`} icon={SettingsIcon}>
        project settings
      </ResponsiveActionButton>
    </RequiresAdminRole>
  );
};
