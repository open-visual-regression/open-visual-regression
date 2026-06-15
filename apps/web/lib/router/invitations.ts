"use server";

import { ORPCError } from "@orpc/client";
import { os } from "./os";
import { unauthenticatedMiddleware } from "./middleware";
import { auth } from "../auth/auth";
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

    const createUserResult = await auth.api
      .createUser({ body: { name: input.name, email: invitation.email, password: input.password } })
      .catch((err: Error) => {
        throw new ORPCError("BAD_REQUEST", { message: err.message });
      });

    if (!createUserResult?.user?.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "failed to create account" });
    }

    const [signInError, signInResponse] = await authServerClient.signInEmail({
      email: invitation.email,
      password: input.password,
    });

    if (signInError || !signInResponse) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "failed to sign in" });
    }

    const setCookieHeader = signInResponse.headers.get("set-cookie") ?? "";
    const sessionCookie = setCookieHeader.split(";")[0];
    const sessionHeaders = new Headers({ cookie: sessionCookie });

    const [acceptError] = await authServerClient.acceptInvitation({
      invitationId: input.invitationId,
      headers: sessionHeaders,
    });

    if (acceptError) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: acceptError.message });
    }
  })
  .actionable();
