"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";
import type { GitIntegrationDbSchema } from "@ovr/db/repository/gitIntegrations";
import { formatCheckContext } from "@ovr/git-status/checkContext";
import { encryptToken } from "@ovr/git-status/crypto";
import { getProvider } from "@ovr/git-status/registry";
import { verifyIntegration } from "@ovr/git-status/verifyIntegration";

import { adminMiddleware, authenticatedMiddleware, projectMiddleware } from "./middleware";
import { os } from "./os";

const toIntegration = (integration: GitIntegrationDbSchema) => ({
  provider: integration.provider,
  repoIdentifier: integration.repoIdentifier,
  checkContext: integration.checkContext,
  statusChecksEnabled: integration.statusChecksEnabled,
  credentialType: integration.credentialType,
  connectionId: integration.connectionId,
  externalRepoId: integration.externalRepoId,
});

export const get = os.gitIntegrations.get
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input }) => {
    const integration = await dbClient.gitIntegrations.findByProject(input.projectId);

    if (!integration) {
      return { integration: null };
    }

    return { integration: toIntegration(integration) };
  })
  .actionable();

export const upsert = os.gitIntegrations.upsert
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .use(projectMiddleware)
  .handler(async ({ input, context }) => {
    const checkContext = formatCheckContext(context.project.name);
    const { credential } = input;

    if (credential.type === "connection") {
      const connections = getProvider(input.provider).connections;
      if (!connections) {
        throw new ORPCError("BAD_REQUEST", {
          message: `${input.provider} does not support connections`,
        });
      }

      const repository = await connections.getRepository(
        credential.connectionId,
        credential.repositoryId,
      );
      if ("error" in repository) {
        throw new ORPCError("BAD_REQUEST", { message: repository.error });
      }

      const integration = await dbClient.gitIntegrations.upsertConnection({
        projectId: input.projectId,
        provider: input.provider,
        repoIdentifier: repository.fullName,
        connectionId: repository.connectionId,
        externalRepoId: repository.id,
        checkContext,
      });

      if (!integration) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      return toIntegration(integration);
    }

    const integration = credential.token
      ? await dbClient.gitIntegrations.upsertAccessToken({
          projectId: input.projectId,
          provider: input.provider,
          repoIdentifier: credential.repoIdentifier,
          encryptedToken: encryptToken(credential.token),
          checkContext,
        })
      : await dbClient.gitIntegrations.updateFields({
          projectId: input.projectId,
          provider: input.provider,
          repoIdentifier: credential.repoIdentifier,
          checkContext,
        });

    if (!integration) {
      throw new ORPCError("BAD_REQUEST", { message: "An access token is required" });
    }

    return toIntegration(integration);
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

    return toIntegration(integration);
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
