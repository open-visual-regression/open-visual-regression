"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { os } from "./os";

export const list = os.users.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const { search, sortBy = "name", sortDirection = "asc", limit = 50, offset = 0 } = input ?? {};

    const { rows, total } = await dbClient.users.findAllUsers({
      organizationId: context.organizationId,
      search,
      sortBy,
      sortDirection,
      limit,
      offset,
    });

    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

    return {
      users: rows.map((row) =>
        row.status === "active"
          ? {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role,
              status: "active" as const,
              createdAt: row.createdAt,
            }
          : {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role,
              status: "invited" as const,
              createdAt: row.createdAt,
              invitationUrl: `${baseUrl}/invitations/${row.id}`,
            },
      ),
      total,
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

export const remove = os.users.remove
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const removingSelf = input.users.some(
      (user) => user.status === "active" && user.email === context.user.email,
    );

    if (removingSelf) {
      throw new ORPCError("BAD_REQUEST", { message: "you cannot remove yourself" });
    }

    const cancelInvitation = async (invitationId: string) => {
      const invitation = await dbClient.users.findInvitationById(invitationId);
      const result = await authServerClient.cancelInvitation({
        invitationId,
        headers: context.headers,
      });

      const [error] = result;

      // a failed accept-invitation attempt can leave a user account with no
      // membership behind; clean it up so the email can be re-invited
      if (!error && invitation) {
        const orphanedUser = await dbClient.users.findOrphanedUserByEmail(invitation.email);
        if (orphanedUser) {
          await authServerClient.removeUser({
            userId: orphanedUser.id,
            headers: context.headers,
          });
        }
      }

      return result;
    };

    const results = await Promise.all(
      input.users.map((user) =>
        user.status === "active"
          ? authServerClient.removeMember({
              email: user.email,
              organizationId: context.organizationId,
              headers: context.headers,
            })
          : cancelInvitation(user.invitationId),
      ),
    );

    const [error] = results.find(([error]) => error) ?? [];

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();

export const changeRole = os.users.changeRole
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    if (input.userId === context.user.id) {
      throw new ORPCError("FORBIDDEN", { message: "you cannot change your own role" });
    }

    const [error] = await authServerClient.setRole({
      userId: input.userId,
      role: input.role,
      headers: context.headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();
