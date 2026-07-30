"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { authenticatedMiddleware, unauthenticatedMiddleware } from "./middleware";
import { os } from "./os";

const findPendingInvitation = async (invitationId: string) => {
  const invitation = await dbClient.users.findInvitationById(invitationId);

  if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    return null;
  }

  return invitation;
};

export const getInvitation = os.invitations.getInvitation
  .handler(async ({ input }) => {
    const invitation = await findPendingInvitation(input.invitationId);

    if (!invitation) {
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
    const invitation = await findPendingInvitation(input.invitationId);

    if (!invitation) {
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

export const signUp = os.invitations.signUp
  .use(unauthenticatedMiddleware)
  .handler(async ({ input }) => {
    const invitation = await findPendingInvitation(input.invitationId);

    if (!invitation) {
      throw new ORPCError("BAD_REQUEST", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    const existingUser = await dbClient.users.findByEmail(invitation.email);

    if (existingUser) {
      throw new ORPCError("CONFLICT", {
        message: "an account already exists for this email — sign in to accept the invitation",
      });
    }

    const [signUpError] = await authServerClient.signUpEmail({
      name: input.name,
      email: invitation.email,
      password: input.password,
    });

    if (signUpError) {
      throw new ORPCError("BAD_REQUEST", { message: signUpError.message });
    }

    const [signInError, signInResponse] = await authServerClient.signInEmail({
      email: invitation.email,
      password: input.password,
    });

    if (signInError) {
      throw new ORPCError("BAD_REQUEST", { message: signInError.message });
    }

    const sessionCookie = signInResponse.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");

    const [acceptError] = await authServerClient.acceptInvitation({
      invitationId: input.invitationId,
      headers: new Headers({ cookie: sessionCookie }),
    });

    if (acceptError) {
      throw new ORPCError("BAD_REQUEST", { message: acceptError.message });
    }
  })
  .actionable();
