import { notFound } from "next/navigation";

import { getCachedSession } from "@/lib/auth/session";
import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { UsersSection } from "./_components/users-section/UsersSection";

export type SettingsUsersPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function SettingsUsersPage({ searchParams }: SettingsUsersPageProps) {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    notFound();
  }

  const { search } = await searchParams;

  const [[error, listResult], session] = await Promise.all([
    serverClient.users.list({ search }),
    getCachedSession(),
  ]);

  if (error || !session) {
    serverError(error ?? "session missing after users list fetch");
  }

  return <UsersSection users={listResult.users} currentUserId={session.user.id} search={search} />;
}
