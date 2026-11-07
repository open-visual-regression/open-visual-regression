import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import {
  GitIntegrationForm,
  GitIntegrationFormSkeleton,
  type GitIntegrationFormProps,
} from "./GitIntegrationForm";

type GitIntegrationSectionProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  availableAuthTypes: GitIntegrationFormProps["availableAuthTypes"];
};

export const GitIntegrationSection = ({
  projectId,
  integration,
  availableAuthTypes,
}: GitIntegrationSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2">git integration</Typography>
    <GitIntegrationForm
      projectId={projectId}
      integration={integration}
      availableAuthTypes={availableAuthTypes}
    />
  </div>
);

export const GitIntegrationSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="h2" className="w-40" />
    <GitIntegrationFormSkeleton />
  </div>
);
