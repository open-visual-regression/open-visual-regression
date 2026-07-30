"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { unauthenticatedMiddleware } from "./middleware";
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
  .use(unauthenticatedMiddleware)
  .handler(async ({ input }) => {
    const invitation = await dbClient.users.findInvitationById(input.invitationId);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "this invitation has expired or is no longer valid",
      });
    }

    const existingUser = await dbClient.users.findByEmail(invitation.email);

    if (!existingUser) {
      if (!input.name) {
        throw new ORPCError("BAD_REQUEST", { message: "name is required" });
      }

      const [signUpError] = await authServerClient.signUpEmail({
        name: input.name,
        email: invitation.email,
        password: input.password,
      });

      if (signUpError) {
        throw new ORPCError("BAD_REQUEST", { message: signUpError.message });
      }
    }

    const [signInError, signInResponse] = await authServerClient.signInEmail({
      email: invitation.email,
      password: input.password,
    });

    if (signInError || !signInResponse.ok) {
      throw new ORPCError("BAD_REQUEST", {
        message: "that password does not match the existing account for this email",
      });
    }

    const sessionCookie = signInResponse.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
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
