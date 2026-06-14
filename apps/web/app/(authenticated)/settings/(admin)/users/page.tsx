import { notFound } from "next/navigation";
import { Typography } from "@ovr/ui/components/typography";
import { UsersSection } from "./_components/users-section/UsersSection";
import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

export default async function SettingsUsersPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError();
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const [error, listResult] = await serverClient.users.list();

  if (error) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        users
      </Typography>
      <UsersSection users={listResult.users} />
    </div>
  );
}
