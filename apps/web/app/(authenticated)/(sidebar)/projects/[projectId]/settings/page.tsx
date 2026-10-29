import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { ApiKeysSection } from "./_components/api-keys-section/ApiKeysSection";
import { DeleteProjectSection } from "./_components/delete-project/DeleteProjectSection";
import { GitIntegrationSection } from "./_components/git-integration/GitIntegrationSection";
import { UpdateProjectForm } from "./_components/update-project-form/UpdateProjectForm";

export type ProjectSettingsPageProps = PageProps<"/projects/[projectId]/settings">;

export default async function ProjectSettingsPage(props: ProjectSettingsPageProps) {
  const { projectId } = await props.params;

  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [
    [projectError, projectResult],
    [apiKeysError, apiKeysResult],
    [gitIntegrationError, gitIntegrationResult],
    [gitProvidersError, gitProvidersResult],
  ] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.apiKeys.list({ projectId }),
    serverClient.gitIntegrations.get({ projectId }),
    serverClient.gitProviders.list(),
  ]);

  if (projectError?.code === "NOT_FOUND") {
    return notFound();
  }

  if (projectError || apiKeysError || gitIntegrationError || gitProvidersError) {
    serverError(projectError || apiKeysError || gitIntegrationError || gitProvidersError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        settings
      </Typography>
      <div className="flex flex-col gap-6 w-full lg:w-2/3">
        <UpdateProjectForm project={projectResult.project} />
        <GitIntegrationSection
          projectId={projectId}
          integration={gitIntegrationResult.integration}
          providers={gitProvidersResult.providers}
        />
        <ApiKeysSection projectId={projectId} apiKeys={apiKeysResult.apiKeys} />
        <DeleteProjectSection project={projectResult.project} />
      </div>
    </div>
  );
}
