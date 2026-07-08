"server only";

import { ORPCError, os } from "@orpc/server";

import { dbClient } from "@ovr/db/client";

import { auth } from "../auth/auth";
import { type Session, type User } from "../auth/auth";
import { type RequestContext } from "./os";

export type AuthenticatedContext = RequestContext & {
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
  .$context<AuthenticatedContext>()
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

export const organizationSnapshotMiddleware = os
  .$context<AuthenticatedContext>()
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
