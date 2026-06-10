"use server";

import { ORPCError } from "@orpc/client";
import { os } from "./os";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { auth } from "../auth/auth";
import { dbClient } from "@ovr/db/client";

const assertProjectExists = async (projectId: string, organizationId: string) => {
  const project = await dbClient.projects.getProject({ projectId, organizationId });

  if (!project) {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid project" });
  }
};

export const create = os.apiKeys.create
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    await assertProjectExists(input.projectId, context.organizationId);

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
    await assertProjectExists(input.projectId, context.organizationId);

    const { apiKeys, total } = await dbClient.apiKeys.findByProject({
      projectId: input.projectId,
      limit: input.limit,
      offset: input.offset,
    });
    return {
      apiKeys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        peek: k.prefix,
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
