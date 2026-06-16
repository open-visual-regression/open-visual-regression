"use server";

import { ORPCError } from "@orpc/client";
import { convertSetCookieToCookie } from "better-auth/test";
import { os } from "./os";
import { unauthenticatedMiddleware } from "./middleware";
import { auth } from "../auth/auth";
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

    // TODO: if signUpEmail succeeds but acceptInvitation fails, the user account exists with no
    // org membership and cannot retry (email taken). Risk is low — sequential server-side calls.
    const signUpResponse = await auth.api.signUpEmail({
      body: { name: input.name, email: invitation.email, password: input.password },
      asResponse: true,
    });

    if (!signUpResponse.ok) {
      const body = (await signUpResponse.json()) as { message?: string };
      throw new ORPCError("BAD_REQUEST", {
        message: body?.message ?? "failed to create account",
      });
    }

    const sessionHeaders = convertSetCookieToCookie(new Headers(signUpResponse.headers));

    await auth.api.acceptInvitation({
      body: { invitationId: input.invitationId },
      headers: sessionHeaders,
    });
  })
  .actionable();
