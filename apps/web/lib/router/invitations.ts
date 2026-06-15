"use server";

import { ORPCError } from "@orpc/client";
import { os } from "./os";
import { unauthenticatedMiddleware } from "./middleware";
import { authServerClient } from "../auth";
import { dbClient } from "@ovr/db/client";

export const getInvitation = os.invitations.getInvitation
  .handler(async ({ input }) => {
    const invitation = await dbClient.users.findInvitationById(input.invitationId);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      throw new ORPCError("NOT_FOUND", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    return {
      email: invitation.email,
      organizationName: invitation.organization.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  })
  .actionable();

export const acceptInvitation = os.invitations.acceptInvitation
  .use(unauthenticatedMiddleware)
  .handler(async ({ input }) => {
    const invitation = await dbClient.users.findInvitationById(input.invitationId);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    const [createUserError, createUserResult] = await authServerClient.createUser({
      name: input.name,
      email: invitation.email,
      password: input.password,
    });

    if (createUserError || !createUserResult?.user?.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: createUserError?.message ?? "failed to create account",
      });
    }

    await dbClient.users.acceptInvitation({
      invitationId: input.invitationId,
      userId: createUserResult.user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });
  })
  .actionable();
