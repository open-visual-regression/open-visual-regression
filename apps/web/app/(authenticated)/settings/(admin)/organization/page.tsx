import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { UpdateOrganizationForm } from "./_components/update-organization-form/UpdateOrganizationForm";

export default async function SettingsOrganizationPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [orgError, orgResult] = await serverClient.organizations.getOne();

  if (orgError) {
    serverError(orgError);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        organization
      </Typography>
      <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">
        <UpdateOrganizationForm organization={orgResult.organization} />
      </div>
    </div>
  );
}
