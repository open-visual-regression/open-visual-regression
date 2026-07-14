import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { Typography } from "@ovr/ui/components/typography";

import { GitIntegrationForm } from "./GitIntegrationForm";

type GitIntegrationSectionProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
};

export const GitIntegrationSection = ({ projectId, integration }: GitIntegrationSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2">git integration</Typography>
    <GitIntegrationForm projectId={projectId} integration={integration} />
  </div>
);
