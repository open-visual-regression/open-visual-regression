"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

const PRESIGNED_URL_TTL_SECONDS = 300;
const REDIRECT_CACHE_SECONDS = PRESIGNED_URL_TTL_SECONDS - 60;

export const getObject = os.storage.getObject
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const projectId = input.path.split("/")[0]!;

    const project = await dbClient.projects.getProject({
      projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("FORBIDDEN");
    }

    const url = await storage.getPresignedUrl(input.path, PRESIGNED_URL_TTL_SECONDS);

    return {
      status: 302 as const,
      headers: {
        location: url,
        "cache-control": `private, max-age=${REDIRECT_CACHE_SECONDS}`,
      },
    };
  })
  .actionable();
