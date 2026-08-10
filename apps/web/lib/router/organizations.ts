"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getOne = os.organizations.getOne
  .use(authenticatedMiddleware)
  .handler(async () => {
    const organization = await dbClient.organizations.getOrganization();

    if (!organization) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    return { organization: { id: organization.id, name: organization.name } };
  })
  .actionable();

export const update = os.organizations.update
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const [error] = await authServerClient.updateOrganization({
      organizationId: context.organizationId,
      name: input.name,
      headers: context.headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();
