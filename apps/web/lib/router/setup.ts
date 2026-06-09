"use server";

import { dbClient } from "@ovr/db/client";
import { os } from "./os";
import { auth } from "../auth/auth";
import { ORPCError } from "@orpc/server";
import { unauthenticatedMiddleware } from "./middleware";

export const status = os.setup.status
  .handler(async () => {
    const [organization, userCount] = await Promise.all([
      dbClient.organizations.getOrganization(),
      dbClient.users.getUserCount(),
    ]);

    const status = organization && userCount > 0 ? "completed" : "pending";

    return { status };
  })
  .actionable();

export const exec = os.setup.exec
  .use(unauthenticatedMiddleware)
  .handler(async ({ input }) => {
    const createUserResponse = await auth.api.createUser({
      body: { name: input.name, email: input.email, password: input.password, role: "admin" },
    });

    if (!createUserResponse?.user?.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create the admin user" });
    }

    const slug = input.organizationName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await auth.api.createOrganization({
      body: { name: input.organizationName, slug, userId: createUserResponse.user.id },
    });
  })
  .actionable();
