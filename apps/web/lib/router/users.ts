"use server";

import { ORPCError } from "@orpc/client";
import { os } from "./os";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { dbClient } from "@ovr/db/client";
import { authServerClient } from "../auth";

export const list = os.users.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => {
    const users = await dbClient.users.findAll();

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    };
  })
  .actionable();

export const invite = os.users.invite
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const [error, invitation] = await authServerClient.createInvitation({
      email: input.email,
      organizationId: context.organizationId,
      headers: context.headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }

    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

    return { invitationUrl: `${baseUrl}/invitations/${invitation.id}` };
  })
  .actionable();
