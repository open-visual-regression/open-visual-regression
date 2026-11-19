import { MilestoneIcon } from "@ovr/ui/components/icon";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

export type ProjectBaselineButtonProps = {
  projectId: string;
  hasBaseline: boolean;
};

export const ProjectBaselineButton = ({ projectId, hasBaseline }: ProjectBaselineButtonProps) =>
  hasBaseline ? (
    <ResponsiveActionButton href={`/api/baseline/${projectId}`} icon={MilestoneIcon}>
      view baseline
    </ResponsiveActionButton>
  ) : null;
