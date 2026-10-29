import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import type { GitProviderSummarySchema } from "@ovr/api/contracts/gitProviders";
import { Typography } from "@ovr/ui/components/typography";

import { GitIntegrationForm } from "./GitIntegrationForm";

type GitIntegrationSectionProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  providers: GitProviderSummarySchema[];
};

export const GitIntegrationSection = ({
  projectId,
  integration,
  providers,
}: GitIntegrationSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2">git integration</Typography>
    <GitIntegrationForm projectId={projectId} integration={integration} providers={providers} />
  </div>
);
