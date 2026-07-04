"use server";

import { ORPCError } from "@orpc/server";

import { dbClient } from "@ovr/db/client";
import { ensureBucket } from "@ovr/storage";

import { auth } from "../auth/auth";
import { unauthenticatedMiddleware } from "./middleware";
import { os } from "./os";

const hasSetupBeenCompleted = async () => {
  const [organization, userCount] = await Promise.all([
    dbClient.organizations.getOrganization(),
    dbClient.users.getUserCount(),
  ]);

  return organization != null && userCount > 0;
};

export const status = os.setup.status
  .handler(async () => {
    const isCompleted = await hasSetupBeenCompleted();
    return { status: isCompleted ? "completed" : "pending" };
  })
  .actionable();

export const exec = os.setup.exec
  .use(unauthenticatedMiddleware)
  .handler(async ({ input }) => {
    const isCompleted = await hasSetupBeenCompleted();

    if (isCompleted) {
      throw new ORPCError("FORBIDDEN", { message: "Setup has already been completed" });
    }

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

    // Provision the object storage bucket as part of first-run setup. Best-effort
    // and self-logging, so a storage hiccup never blocks admin creation.
    await ensureBucket();
  })
  .actionable();
