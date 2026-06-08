"use server";

import { adminMiddleware } from "./os";
import { auth } from "../auth/auth";

export const create = adminMiddleware.apiKeys.create
  .handler(async ({ input, context }) => {
    const result = await auth.api.createApiKey({
      body: { name: input.name, prefix: "ovr_api_key_", userId: context.session.user.id },
    });
    return { key: result.key };
  })
  .actionable();

export const list = adminMiddleware.apiKeys.list
  .handler(async ({ input, context }) => {
    const { apiKeys, total } = await auth.api.listApiKeys({
      query: { limit: input.limit, offset: input.offset },
      headers: context.headers,
    });
    return {
      apiKeys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        peek: k.start,
        createdAt: k.createdAt,
        lastRequest: k.lastRequest,
      })),
      total,
    };
  })
  .actionable();

export const revoke = adminMiddleware.apiKeys.revoke
  .handler(async ({ input, context }) => {
    await auth.api.deleteApiKey({
      body: { keyId: input.keyId },
      headers: context.headers,
    });
  })
  .actionable();
