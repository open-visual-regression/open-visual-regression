import { MilestoneIcon } from "@ovr/ui/components/icon";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

export type ProjectBaselineButtonProps = {
  projectId: string;
  baselineBuildId: string | null;
};

export const ProjectBaselineButton = ({
  projectId,
  baselineBuildId,
}: ProjectBaselineButtonProps) => (
  <ResponsiveActionButton
    href={baselineBuildId ? `/projects/${projectId}/builds/${baselineBuildId}` : null}
    icon={MilestoneIcon}
  >
    view baseline
  </ResponsiveActionButton>
);
