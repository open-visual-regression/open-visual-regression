"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getInvitation = os.invitations.getInvitation
  .handler(async ({ input }) => {
    const invitation = await dbClient.users.findInvitationById(input.invitationId);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      throw new ORPCError("NOT_FOUND", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    const existingUser = await dbClient.users.findByEmail(invitation.email);

    return {
      email: invitation.email,
      organizationName: invitation.organization.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      hasAccount: !!existingUser,
    };
  })
  .actionable();

export const acceptInvitation = os.invitations.acceptInvitation
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const invitation = await dbClient.users.findInvitationById(input.invitationId);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    if (invitation.email !== context.user.email) {
      throw new ORPCError("FORBIDDEN", {
        message: `this invitation was sent to ${invitation.email}`,
      });
    }

    const [error] = await authServerClient.acceptInvitation({
      invitationId: input.invitationId,
      headers: context.headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();
