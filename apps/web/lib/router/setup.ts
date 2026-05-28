import { db } from "@ovr/db";
import { os } from "./os";
import { auth } from "../auth/auth";
import { ORPCError } from "@orpc/server";

export const status = os.setup.status
  .handler(async () => {
    const [organizationCount, userCount] = await Promise.all([
      db.organizations.getOrganizationCount(),
      db.users.getUserCount(),
    ]);

    const status = organizationCount > 0 && userCount > 0 ? "completed" : "pending";

    return { status };
  })
  .actionable();

export const exec = os.setup.exec
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

    await auth.api.createOrganization({
      body: { name: input.organizationName, slug, userId: signUpResponse.user.id },
    });
  })
  .actionable();
