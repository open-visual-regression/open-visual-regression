import { Typography } from "@ovr/ui/components/typography";
import { ApiKeysSection } from "./_components/api-keys-section/ApiKeysSection";
import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { notFound } from "next/navigation";
import { serverError } from "@/lib/utils/errors";

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

  const [error, apiKeysResult] = await serverClient.apiKeys.list({ projectId });

  if (error) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        settings
      </Typography>
      <ApiKeysSection projectId={projectId} apiKeys={apiKeysResult.apiKeys} />
    </div>
  );
}
