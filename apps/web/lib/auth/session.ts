import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getLoginPath, REQUEST_PATH_HEADER } from "@/lib/utils/redirects";

import { auth } from "./auth";
import { getAuthConfig, type TrustedProxyConfig } from "./config";
import { resolveRole, verifyProxyToken } from "./proxyToken";
import { TRUSTED_PROXY_PROVIDER_ID } from "./trustedProxy";

const getTrustedProxySession = async (requestHeaders: Headers, config: TrustedProxyConfig) => {
  const [session, [, identity]] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } }),
    verifyProxyToken(requestHeaders, config),
  ]);

  if (!session || !identity) {
    return session;
  }

  const { internalAdapter } = await auth.$context;
  const owner = await internalAdapter.findAccountOwnerByKey({
    providerId: TRUSTED_PROXY_PROVIDER_ID,
    accountId: identity.subject,
  });

  if (owner?.kind !== "owned" || owner.user.id !== session.user.id) {
    return null;
  }

  const role = resolveRole(identity.groups, config.roleGroups);

  if (!role) {
    await internalAdapter.deleteUserSessions(session.user.id);
    return null;
  }

  if (role === session.user.role) {
    return session;
  }

  await internalAdapter.updateUser(session.user.id, { role });

  return { ...session, user: { ...session.user, role } };
};

export const getCachedSession = cache(async () => {
  const requestHeaders = await headers();
  const config = getAuthConfig();

  if (config.mode !== "trusted-proxy") {
    return auth.api.getSession({ headers: requestHeaders });
  }

  return getTrustedProxySession(requestHeaders, config);
});

export const requireSession = async () => {
  const session = await getCachedSession();

  if (!session) {
    const requestPath = (await headers()).get(REQUEST_PATH_HEADER);

    redirect(requestPath ? getLoginPath(requestPath) : "/login");
  }

  return session;
};
