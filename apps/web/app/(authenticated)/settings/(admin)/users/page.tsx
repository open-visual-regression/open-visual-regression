import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { UsersSection } from "./_components/users-section/UsersSection";
import { serverClient } from "@/lib/router";
import { auth } from "@/lib/auth/auth";
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

  const [[error, listResult], session] = await Promise.all([
    serverClient.users.list(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error || !session) {
    serverError();
  }

  return <UsersSection users={listResult.users} currentUserId={session.user.id} />;
}
