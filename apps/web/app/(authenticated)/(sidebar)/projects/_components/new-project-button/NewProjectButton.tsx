import { PlusIcon } from "@ovr/ui/components/icon";

import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

export type NewProjectButtonProps = {
  role: string | null | undefined;
};

export const NewProjectButton = ({ role }: NewProjectButtonProps) => (
  <RequiresAdminRole role={role}>
    <ResponsiveActionButton href="/projects/new" icon={PlusIcon}>
      new project
    </ResponsiveActionButton>
  </RequiresAdminRole>
);
