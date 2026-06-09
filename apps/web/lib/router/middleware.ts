"server only";

import { ORPCError, os } from "@orpc/server";
import { auth } from "../auth/auth";
import { type Session, type User } from "../auth/auth";
import { type RequestContext } from "./os";

type AuthenticatedContext = RequestContext & {
  session: { session: Session; user: User };
  organizationId: string;
};

export const unauthenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });

    if (session) {
      throw new ORPCError("UNAUTHORIZED");
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
        session: sessionResult,
        organizationId: sessionResult.session.activeOrganizationId,
      },
    });
  });

export const adminMiddleware = os
  .$context<AuthenticatedContext>()
  .middleware(async ({ context, next }) => {
    if (context.session.user.role !== "admin") throw new ORPCError("FORBIDDEN");
    return next();
  });
