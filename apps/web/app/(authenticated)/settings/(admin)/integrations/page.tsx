import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { GithubAppSection } from "./_components/github-app-section/GithubAppSection";

export default async function SettingsIntegrationsPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [statusError, status] = await serverClient.githubApp.status();

  if (statusError) {
    serverError(statusError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        integrations
      </Typography>
      <GithubAppSection status={status} />
    </div>
  );
}
