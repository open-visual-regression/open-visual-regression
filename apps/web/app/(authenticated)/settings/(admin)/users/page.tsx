import { notFound } from "next/navigation";

import { getAuthConfig } from "@/lib/auth/config";
import { getCachedSession } from "@/lib/auth/session";
import { serverClient } from "@/lib/router";
import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { SsoReadinessSection } from "./_components/sso-readiness-section/SsoReadinessSection";
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

  const users = (
    <UsersSection users={listResult.users} currentUserId={session.user.id} search={search} />
  );

  if (getAuthConfig().mode !== "trusted-proxy-shadow") {
    return users;
  }

  const [readinessError, readinessResult] = await serverClient.users.listSsoReadiness();

  if (readinessError) {
    serverError(readinessError);
  }

  return (
    <div className="flex flex-col gap-10">
      {users}
      <SsoReadinessSection rows={readinessResult.rows} />
    </div>
  );
}
