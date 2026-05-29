"server only";

import { ORPCError, os } from "@orpc/server";
import { auth } from "../auth/auth";
import { type RequestContext } from "./os";

export const unauthenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ context, next }) => {
    console.log(context);
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
        ...sessionResult,
        organizationId: sessionResult.session.activeOrganizationId,
      },
    });
  });
