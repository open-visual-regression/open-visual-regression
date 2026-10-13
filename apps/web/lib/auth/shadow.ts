import { headers } from "next/headers";
import { cache } from "react";

import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";

import { getAuthConfig } from "./config";
import { resolveRole, verifyProxyToken } from "./proxyToken";

const logger = createLogger("auth");

export const recordProxyIdentity = cache(async () => {
  const config = getAuthConfig();

  if (config.mode !== "trusted-proxy-shadow") {
    return;
  }

  const [error, identity] = await verifyProxyToken(await headers(), config);

  if (error) {
    logger.warn({ err: error }, "rejected a proxy identity token in shadow mode");
    return;
  }

  if (!identity) {
    return;
  }

  try {
    await dbClient.ssoIdentities.record({
      issuer: identity.issuer,
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      role: resolveRole(identity.groups, config.roleGroups),
    });
  } catch (err) {
    logger.error({ err }, "failed to record a proxy identity in shadow mode");
  }
});
