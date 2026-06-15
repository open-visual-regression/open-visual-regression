import { notFound } from "next/navigation";
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

  return <UsersSection users={listResult.users} />;
}
