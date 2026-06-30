"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

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

    const url = await storage.getPresignedUrl(input.path, 60);

    return { status: 302 as const, headers: { location: url } };
  })
  .actionable();
