import { MilestoneIcon } from "@ovr/ui/components/icon";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

export type ProjectBaselineButtonProps = {
  projectId: string;
  baselineBuildId: string | null;
};

export const ProjectBaselineButton = ({ projectId, baselineBuildId }: ProjectBaselineButtonProps) =>
  baselineBuildId ? (
    <ResponsiveActionButton
      href={`/projects/${projectId}/builds/${baselineBuildId}`}
      icon={MilestoneIcon}
    >
      view baseline
    </ResponsiveActionButton>
  ) : null;
