"use server";

import { ORPCError } from "@orpc/client";
import { os } from "./os";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { dbClient } from "@ovr/db/client";
import { authServerClient } from "../auth";

export const list = os.users.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ context }) => {
    const [users, invitations] = await Promise.all([
      dbClient.users.findAllUsers(),
      dbClient.users.findPendingInvitations(context.organizationId),
    ]);

    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

    return {
      users: [
        ...users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: "active" as const,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          invitationUrl: null,
        })),
        ...invitations.map((i) => ({
          id: i.id,
          name: i.email,
          email: i.email,
          role: i.role,
          status: "invited" as const,
          createdAt: i.createdAt,
          lastLoginAt: null,
          invitationUrl: `${baseUrl}/invitations/${i.id}`,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
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
