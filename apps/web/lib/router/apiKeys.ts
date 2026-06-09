"use server";

import { os } from "./os";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { auth } from "../auth/auth";

export const create = os.apiKeys.create
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const result = await auth.api.createApiKey({
      body: { name: input.name, prefix: "ovr_api_key_", userId: context.session.user.id },
    });
    return { key: result.key };
  })
  .actionable();

export const list = os.apiKeys.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
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
