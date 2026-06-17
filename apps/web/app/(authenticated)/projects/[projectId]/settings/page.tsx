import { Typography } from "@ovr/ui/components/typography";
import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { notFound } from "next/navigation";
import { serverError } from "@/lib/utils/errors";
import { ApiKeysSection } from "./_components/api-keys-section/ApiKeysSection";
import { UpdateProjectForm } from "./_components/update-project-form/UpdateProjectForm";
import { CaptureConfigurationsSection } from "./_components/capture-configurations-section/CaptureConfigurationsSection";

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
    [captureConfigsError, captureConfigsResult],
    [apiKeysError, apiKeysResult],
  ] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.captureConfigurations.list({ projectId }),
    serverClient.apiKeys.list({ projectId }),
  ]);

  if (projectError?.code === "NOT_FOUND") {
    return notFound();
  }

  if (projectError || captureConfigsError || apiKeysError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        settings
      </Typography>
      <div className="flex flex-col gap-6 w-full md:w-3/4 lg:w-2/3">
        <UpdateProjectForm project={projectResult.project} />
        <CaptureConfigurationsSection
          projectId={projectId}
          captureConfigurations={captureConfigsResult.captureConfigurations}
        />
        <ApiKeysSection projectId={projectId} apiKeys={apiKeysResult.apiKeys} />
      </div>
    </div>
  );
}
