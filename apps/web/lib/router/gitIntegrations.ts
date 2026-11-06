"use server";

import { ORPCError } from "@orpc/client";

import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { dbClient } from "@ovr/db/client";
import type { GitIntegrationDbSchema } from "@ovr/db/repository/gitIntegrations";
import { availableAuthTypes, verifyIntegration } from "@ovr/git-status/auth";
import { formatCheckContext } from "@ovr/git-status/checkContext";
import { encryptToken } from "@ovr/git-status/crypto";

import { adminMiddleware, authenticatedMiddleware, projectMiddleware } from "./middleware";
import { os } from "./os";

const toGitIntegration = (integration: GitIntegrationDbSchema): GitIntegrationSchema => ({
  provider: integration.provider,
  repoIdentifier: integration.repoIdentifier,
  checkContext: integration.checkContext,
  statusChecksEnabled: integration.statusChecksEnabled,
  authType: integration.authType,
  hasToken: integration.encryptedToken !== null,
});

export const get = os.gitIntegrations.get
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = await dbClient.gitIntegrations.findByProject(input.projectId);

    return {
      integration: integration ? toGitIntegration(integration) : null,
      availableAuthTypes: availableAuthTypes(),
    };
  })
  .actionable();

export const upsert = os.gitIntegrations.upsert
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input, context }) => {
    if (!availableAuthTypes()[input.provider].includes(input.authType)) {
      throw new ORPCError("BAD_REQUEST", {
        message: `${input.authType} authentication is not available for ${input.provider} on this deployment`,
      });
    }

    const fields = {
      projectId: input.projectId,
      provider: input.provider,
      repoIdentifier: input.repoIdentifier,
      checkContext: formatCheckContext(context.project.name),
    };

    // Only token auth stores a credential. Every other method drops any token left over.
    if (input.authType !== "token") {
      const integration = await dbClient.gitIntegrations.upsert({
        ...fields,
        authType: input.authType,
        encryptedToken: null,
      });
      return toGitIntegration(integration!);
    }

    if (input.token) {
      const integration = await dbClient.gitIntegrations.upsert({
        ...fields,
        authType: "token",
        encryptedToken: encryptToken(input.token),
      });
      return toGitIntegration(integration!);
    }

    // Saving without a token keeps the stored one, so there has to be one to keep.
    const existing = await dbClient.gitIntegrations.findByProject(input.projectId);
    if (existing?.authType !== "token" || existing.encryptedToken === null) {
      throw new ORPCError("BAD_REQUEST", { message: "An access token is required" });
    }

    const integration = await dbClient.gitIntegrations.updateFields(fields);
    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "An access token is required" });
    }

    return toGitIntegration(integration);
  })
  .actionable();

export const setStatusChecks = os.gitIntegrations.setStatusChecks
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = await dbClient.gitIntegrations.setStatusChecksEnabled(
      input.projectId,
      input.enabled,
    );

    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "No git integration configured" });
    }

    return toGitIntegration(integration);
  })
  .actionable();

export const remove = os.gitIntegrations.remove
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    await dbClient.gitIntegrations.remove(input.projectId);
  })
  .actionable();

export const testConnection = os.gitIntegrations.testConnection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = await dbClient.gitIntegrations.findByProject(input.projectId);

    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "No git integration configured" });
    }

    return verifyIntegration(integration);
  })
  .actionable();
