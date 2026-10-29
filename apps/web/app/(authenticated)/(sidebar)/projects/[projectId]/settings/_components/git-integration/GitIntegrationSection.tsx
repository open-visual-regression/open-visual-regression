import type { GithubAppRepositoriesSchema } from "@ovr/api/contracts/githubApp";
import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { GitIntegrationForm, GitIntegrationFormSkeleton } from "./GitIntegrationForm";

type GitIntegrationSectionProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  githubApp: GithubAppRepositoriesSchema;
};

export const GitIntegrationSection = ({
  projectId,
  integration,
  githubApp,
}: GitIntegrationSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2">git integration</Typography>
    <GitIntegrationForm projectId={projectId} integration={integration} githubApp={githubApp} />
  </div>
);

export const GitIntegrationSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="h2" className="w-40" />
    <GitIntegrationFormSkeleton />
  </div>
);
