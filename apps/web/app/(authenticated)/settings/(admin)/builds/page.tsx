import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { DiffSettingsSection } from "./_components/diff-settings-section/DiffSettingsSection";

export default async function SettingsBuildsPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [diffSettingsError, diffSettingsResult] = await serverClient.settings.getDiffSettings();

  if (diffSettingsError) {
    serverError(diffSettingsError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        builds
      </Typography>
      <DiffSettingsSection settings={diffSettingsResult.settings} />
    </div>
  );
}
