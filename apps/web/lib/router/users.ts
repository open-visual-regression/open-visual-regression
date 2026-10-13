"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";

import { authServerClient } from "../auth";
import { getAuthConfig } from "../auth/config";
import { authenticatedMiddleware, adminMiddleware, localAuthMiddleware } from "./middleware";
import { os } from "./os";
import { getSsoReadinessRows } from "./utils/ssoReadiness";

const requireShadowMode = () => {
  if (getAuthConfig().mode !== "trusted-proxy-shadow") {
    throw new ORPCError("PRECONDITION_FAILED", { message: "SSO shadow mode is not enabled" });
  }
};

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
  .use(localAuthMiddleware)
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
  .use(localAuthMiddleware)
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const removingSelf = input.users.some(
      (user) => user.status === "active" && user.email === context.user.email,
    );

    if (removingSelf) {
      throw new ORPCError("BAD_REQUEST", { message: "you cannot remove yourself" });
    }

    const results = await Promise.all(
      input.users.map((user) =>
        user.status === "active"
          ? authServerClient.removeMember({
              email: user.email,
              organizationId: context.organizationId,
              headers: context.headers,
            })
          : authServerClient.cancelInvitation({
              invitationId: user.invitationId,
              headers: context.headers,
            }),
      ),
    );

    const [error] = results.find(([error]) => error) ?? [];

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();

export const changeRole = os.users.changeRole
  .use(localAuthMiddleware)
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

export const listSsoReadiness = os.users.listSsoReadiness
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ context }) => {
    requireShadowMode();

    const [members, identities] = await Promise.all([
      dbClient.users.findMembers(context.organizationId),
      dbClient.ssoIdentities.findAll(),
    ]);

    return { rows: getSsoReadinessRows(members, identities) };
  })
  .actionable();

export const confirmSsoMatch = os.users.confirmSsoMatch
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    requireShadowMode();

    const [identity, membership] = await Promise.all([
      dbClient.ssoIdentities.findById(input.identityId),
      dbClient.organizations.findMembership({
        userId: input.userId,
        organizationId: context.organizationId,
      }),
    ]);

    if (!identity || !membership) {
      throw new ORPCError("NOT_FOUND");
    }

    await dbClient.ssoIdentities.confirmUser({ id: identity.id, userId: input.userId });
  })
  .actionable();
