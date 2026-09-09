"use server";

import { ORPCError } from "@orpc/client";

import { ACCESS_TOKEN_PERMISSIONS } from "@ovr/api/contracts/accessTokens";
import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const create = os.accessTokens.create
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const [error, token] = await authServerClient.createAccessToken({
      name: input.name,
      userId: context.user.id,
      permissions: ACCESS_TOKEN_PERMISSIONS,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }

    return { token: token.key };
  })
  .actionable();

export const list = os.accessTokens.list
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { accessTokens, total } = await dbClient.accessTokens.findByUser({
      userId: context.user.id,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      accessTokens: accessTokens.map((token) => ({
        id: token.id,
        name: token.name!,
        createdAt: token.createdAt,
        lastRequest: token.lastRequest,
      })),
      total,
    };
  })
  .actionable();

export const revoke = os.accessTokens.revoke
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const token = await dbClient.accessTokens.findByIdForUser({
      tokenId: input.tokenId,
      userId: context.user.id,
    });

    if (!token) {
      throw new ORPCError("NOT_FOUND");
    }

    const [error] = await authServerClient.deleteAccessToken({
      tokenId: input.tokenId,
      headers: context.headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();
