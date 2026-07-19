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
    serverError();
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [
    [projectError, projectResult],
    [apiKeysError, apiKeysResult],
    [gitIntegrationError, gitIntegrationResult],
  ] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.apiKeys.list({ projectId }),
    serverClient.gitIntegrations.get({ projectId }),
  ]);

  if (projectError?.code === "NOT_FOUND") {
    return notFound();
  }

  if (projectError || apiKeysError || gitIntegrationError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        settings
      </Typography>
      <div className="flex flex-col gap-6 w-full md:w-3/4 lg:w-2/3">
        <UpdateProjectForm project={projectResult.project} />
        <GitIntegrationSection
          projectId={projectId}
          integration={gitIntegrationResult.integration}
        />
        <ApiKeysSection projectId={projectId} apiKeys={apiKeysResult.apiKeys} />
        <DeleteProjectSection project={projectResult.project} />
      </div>
    </div>
  );
}
