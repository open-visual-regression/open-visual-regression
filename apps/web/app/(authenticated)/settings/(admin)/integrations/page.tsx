import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { GitProviderConnectionsSection } from "./_components/git-provider-connections/GitProviderConnectionsSection";

export default async function SettingsIntegrationsPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [connectionsError, connectionsResult] = await serverClient.gitProviders.connections();

  if (connectionsError) {
    serverError(connectionsError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        integrations
      </Typography>
      {connectionsResult.providers.map((connections) => (
        <GitProviderConnectionsSection key={connections.provider} connections={connections} />
      ))}
    </div>
  );
}
