"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";

import { auth } from "../auth/auth";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { os } from "./os";

export const create = os.apiKeys.create
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const project = await dbClient.projects.getProject({
      projectId: input.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid project" });
    }

    const result = await auth.api.createApiKey({
      body: {
        name: input.name,
        prefix: "ovr_api_key_",
        userId: context.user.id,
        metadata: { projectId: input.projectId },
      },
    });
    return { key: result.key };
  })
  .actionable();

export const list = os.apiKeys.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const project = await dbClient.projects.getProject({
      projectId: input.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid project" });
    }

    const { apiKeys, total } = await dbClient.apiKeys.findByProject({
      projectId: input.projectId,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      apiKeys: apiKeys.map((k) => ({
        id: k.id,
        // `name` is required by createApiKeyInputSchema, so every key created through
        // this app has one — better-auth's column type is nullable, but ours never is.
        name: k.name!,
        ownerName: k.ownerName,
        createdAt: k.createdAt,
        lastRequest: k.lastRequest,
      })),
      total,
    };
  })
  .actionable();

export const revoke = os.apiKeys.revoke
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    await auth.api.deleteApiKey({
      body: { keyId: input.keyId },
      headers: context.headers,
    });
  })
  .actionable();
