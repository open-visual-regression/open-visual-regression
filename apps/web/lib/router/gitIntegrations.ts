"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";
import { decryptToken, encryptToken } from "@ovr/git-status/crypto";
import { verifyIntegration } from "@ovr/git-status/verifyIntegration";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

const requireProject = async (projectId: string, organizationId: string): Promise<void> => {
  const project = await dbClient.projects.getProject({ projectId, organizationId });
  if (!project) {
    throw new ORPCError("NOT_FOUND");
  }
};

export const get = os.gitIntegrations.get
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    await requireProject(input.projectId, context.organizationId);

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
  .handler(async ({ input, context }) => {
    await requireProject(input.projectId, context.organizationId);

    const integration = await dbClient.gitIntegrations.upsert({
      projectId: input.projectId,
      provider: input.provider,
      baseUrl: input.baseUrl,
      repoIdentifier: input.repoIdentifier,
      encryptedToken: encryptToken(input.token),
      checkContext: input.checkContext,
    });

    return {
      provider: integration!.provider,
      baseUrl: integration!.baseUrl,
      repoIdentifier: integration!.repoIdentifier,
      checkContext: integration!.checkContext,
      hasToken: true as const,
    };
  })
  .actionable();

export const remove = os.gitIntegrations.remove
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    await requireProject(input.projectId, context.organizationId);
    await dbClient.gitIntegrations.remove(input.projectId);
  })
  .actionable();

export const testConnection = os.gitIntegrations.testConnection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    await requireProject(input.projectId, context.organizationId);

    const integration = await dbClient.gitIntegrations.findByProject(input.projectId);

    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "No git integration configured" });
    }

    return verifyIntegration({
      provider: integration.provider,
      baseUrl: integration.baseUrl,
      repoIdentifier: integration.repoIdentifier,
      token: decryptToken(integration.encryptedToken),
    });
  })
  .actionable();
