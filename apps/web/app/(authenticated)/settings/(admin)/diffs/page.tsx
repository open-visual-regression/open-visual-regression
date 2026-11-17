import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { DiffSettingsForm } from "./_components/diff-settings-form/DiffSettingsForm";

export default async function SettingsDiffsPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [diffSettingsError, diffSettingsResult] = await serverClient.settings.getDiff();

  if (diffSettingsError) {
    serverError(diffSettingsError);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h1" as="h1">
          diffs
        </Typography>
        <Typography variant="body-muted" as="p">
          how the diff overlay on a snapshot marks what changed
        </Typography>
      </div>
      <DiffSettingsForm settings={diffSettingsResult.settings} />
    </div>
  );
}
