"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";
import { encryptToken } from "@ovr/git-status/crypto";

import { adminMiddleware, authenticatedMiddleware, projectMiddleware } from "./middleware";
import { os } from "./os";

export const get = os.gitIntegrations.get
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = await dbClient.gitIntegrations.findByProject(input.projectId);

    if (!integration) {
      return { integration: null };
    }

    return {
      integration: {
        provider: integration.provider,
        baseUrl: integration.baseUrl,
        repoIdentifier: integration.repoIdentifier,
        checkContext: integration.checkContext,
        hasToken: true as const,
      },
    };
  })
  .actionable();

export const upsert = os.gitIntegrations.upsert
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = input.token
      ? await dbClient.gitIntegrations.upsert({
          projectId: input.projectId,
          provider: input.provider,
          baseUrl: input.baseUrl,
          repoIdentifier: input.repoIdentifier,
          encryptedToken: encryptToken(input.token),
          checkContext: input.checkContext,
        })
      : await dbClient.gitIntegrations.updateFields({
          projectId: input.projectId,
          provider: input.provider,
          baseUrl: input.baseUrl,
          repoIdentifier: input.repoIdentifier,
          checkContext: input.checkContext,
        });

    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "An access token is required" });
    }

    return {
      provider: integration.provider,
      baseUrl: integration.baseUrl,
      repoIdentifier: integration.repoIdentifier,
      checkContext: integration.checkContext,
      hasToken: true as const,
    };
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
