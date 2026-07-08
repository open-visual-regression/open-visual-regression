import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { Typography } from "@ovr/ui/components/typography";

import { GitIntegrationForm } from "./GitIntegrationForm";

type GitIntegrationSectionProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
};

export const GitIntegrationSection = ({ projectId, integration }: GitIntegrationSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2">ci status check</Typography>
      <Typography variant="body-muted">
        publish this project&apos;s build verdict as a commit status on your git provider. your
        branch protection decides whether it blocks merge.
      </Typography>
    </div>
    <GitIntegrationForm projectId={projectId} integration={integration} />
  </div>
);
