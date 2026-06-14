"server only";

import { ORPCError, os } from "@orpc/server";
import { auth } from "../auth/auth";
import { type Session, type User } from "../auth/auth";
import { type RequestContext } from "./os";

type AuthenticatedContext = RequestContext & {
  session: Session;
  user: User;
  organizationId: string;
};

export const unauthenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });

    if (session) {
      throw new ORPCError("FORBIDDEN");
    }

    return next();
  });

export const authenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ context, next }) => {
    const sessionResult = await auth.api.getSession({
      headers: context.headers,
    });

    if (!sessionResult?.session.activeOrganizationId) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: {
        ...sessionResult,
        organizationId: sessionResult.session.activeOrganizationId,
      },
    });
  });

export const adminMiddleware = os
  .$context<AuthenticatedContext>()
  .middleware(async ({ context, next }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN");
    }

    return next();
  });

export const apiKeyMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ context, next }) => {
    const bearer = context.headers.get("authorization")?.replace("Bearer ", "");

    if (!bearer) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const result = await auth.api.verifyApiKey({ body: { key: bearer } });

    if (!result.valid || !result.key) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const projectId = result.key.metadata?.projectId;

    if (typeof projectId !== "string") {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({ context: { apiKey: result.key, projectId } });
  });
