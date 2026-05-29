"use server";

import { dbClient } from "@ovr/db/client";
import { os } from "./os";
import { auth } from "../auth/auth";
import { ORPCError } from "@orpc/server";
import { unauthenticatedMiddleware } from "./middleware";
import { headers } from "next/headers";

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
    const signUpResponse = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });

    if (!signUpResponse?.user?.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to sign up user" });
    }

    const slug = input.organizationName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const organization = await auth.api.createOrganization({
      body: { name: input.organizationName, slug, userId: signUpResponse.user.id },
    });

    await auth.api.setActiveOrganization({
      body: { organizationId: organization.id },
      headers: await headers(),
    });
  })
  .actionable();
