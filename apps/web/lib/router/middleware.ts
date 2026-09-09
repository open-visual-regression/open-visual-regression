"server only";

import { ORPCError, os } from "@orpc/server";

import { tokenPermissionsSchema } from "@ovr/api/contracts/accessTokens";
import { dbClient } from "@ovr/db/client";
import { isPersonalTokenMetadata } from "@ovr/db/repository/accessTokens";

import { auth } from "../auth/auth";
import { type Session, type User } from "../auth/auth";
import { canReview } from "../auth/roles";
import { getCachedSession } from "../auth/session";
import { type RequestContext } from "./os";

export type OrganizationScopedContext = RequestContext & {
  organizationId: string;
};

export type UserContext = OrganizationScopedContext & {
  user: User;
};

export type AuthenticatedContext = UserContext & {
  session: Session;
};

type Caller = {
  user: User;
  organizationId: string;
};

const requireSessionIdentity = async () => {
  const sessionResult = await getCachedSession();

  if (!sessionResult?.session.activeOrganizationId) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return { ...sessionResult, organizationId: sessionResult.session.activeOrganizationId };
};

const resolveSessionCaller = async (): Promise<Caller> => {
  const { user, organizationId } = await requireSessionIdentity();

  return { user, organizationId };
};

const resolveTokenCaller = async (
  bearer: string,
  resource: string,
  action: string,
): Promise<Caller> => {
  const result = await auth.api.verifyApiKey({ body: { key: bearer } });

  if (result.error?.code === "RATE_LIMITED") {
    throw new ORPCError("TOO_MANY_REQUESTS");
  }

  if (!result.valid || !result.key) {
    throw new ORPCError("UNAUTHORIZED");
  }

  if (!isPersonalTokenMetadata(result.key.metadata)) {
    throw new ORPCError("FORBIDDEN", {
      message: "only a personal access token can be used here",
    });
  }

  const granted = tokenPermissionsSchema.safeParse(result.key.permissions).data;

  if (!granted?.[resource]?.includes(action)) {
    throw new ORPCError("FORBIDDEN", { message: `this token cannot ${action} ${resource}` });
  }

  const organization = await dbClient.organizations.getOrganization();

  if (!organization) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const [owner, membership] = await Promise.all([
    dbClient.users.findById(result.key.referenceId),
    dbClient.organizations.findMembership({
      userId: result.key.referenceId,
      organizationId: organization.id,
    }),
  ]);

  if (!owner || !membership) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return { user: owner, organizationId: organization.id };
};

export const unauthenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ next }) => {
    const session = await getCachedSession();

    if (session) {
      throw new ORPCError("FORBIDDEN");
    }

    return next();
  });

export const authenticatedMiddleware = os
  .$context<RequestContext>()
  .middleware(async ({ next }) => next({ context: await requireSessionIdentity() }));

export const adminMiddleware = os.$context<UserContext>().middleware(async ({ context, next }) => {
  if (context.user.role !== "admin") {
    throw new ORPCError("FORBIDDEN");
  }

  return next();
});

export const reviewerMiddleware = os
  .$context<UserContext>()
  .middleware(async ({ context, next }) => {
    if (!canReview(context.user.role)) {
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

    if (result.error?.code === "RATE_LIMITED") {
      throw new ORPCError("TOO_MANY_REQUESTS");
    }

    if (!result.valid || !result.key) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const projectId = result.key.metadata?.projectId;

    if (typeof projectId !== "string") {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({ context: { apiKey: result.key, projectId } });
  });

export const callerMiddleware = (resource: string, action: string) =>
  os.$context<RequestContext>().middleware(async ({ context, next }) => {
    const bearer = context.headers.get("authorization")?.replace("Bearer ", "");

    const caller = bearer
      ? await resolveTokenCaller(bearer, resource, action)
      : await resolveSessionCaller();

    return next({ context: caller });
  });

export const projectMiddleware = os
  .$context<AuthenticatedContext>()
  .middleware(async ({ context, next }, input: { projectId: string }) => {
    const project = await dbClient.projects.getProject({
      projectId: input.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({ context: { project } });
  });

export const organizationBuildMiddleware = os
  .$context<OrganizationScopedContext>()
  .middleware(async ({ context, next }, input: { buildId: string }) => {
    const build = await dbClient.builds.findById(input.buildId);

    if (!build) {
      throw new ORPCError("NOT_FOUND");
    }

    const project = await dbClient.projects.getProject({
      projectId: build.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({ context: { build, project } });
  });

export const organizationDiffMiddleware = os
  .$context<OrganizationScopedContext>()
  .middleware(async ({ context, next }, input: { diffId: string }) => {
    const diff = await dbClient.diffs.findById(input.diffId);

    if (!diff) {
      throw new ORPCError("NOT_FOUND");
    }

    const snapshot = await dbClient.snapshots.findById(diff.snapshotId);

    if (!snapshot) {
      throw new ORPCError("NOT_FOUND");
    }

    const build = await dbClient.builds.findById(snapshot.buildId);

    if (!build) {
      throw new ORPCError("NOT_FOUND");
    }

    const project = await dbClient.projects.getProject({
      projectId: build.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({ context: { diff, snapshot, build, project } });
  });

export const organizationSnapshotMiddleware = os
  .$context<OrganizationScopedContext>()
  .middleware(async ({ context, next }, input: { snapshotId: string }) => {
    const snapshot = await dbClient.snapshots.findById(input.snapshotId);

    if (!snapshot) {
      throw new ORPCError("NOT_FOUND");
    }

    const build = await dbClient.builds.findById(snapshot.buildId);

    if (!build) {
      throw new ORPCError("NOT_FOUND");
    }

    const project = await dbClient.projects.getProject({
      projectId: build.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({ context: { snapshot, build, project } });
  });
