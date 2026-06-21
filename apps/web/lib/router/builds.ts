"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { createBuild as createBuildService, getArtifactPath } from "@ovr/services/builds";
import { storage } from "@ovr/storage";
import type { SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";
import type { DiffDbSchema } from "@ovr/db/repository/diffs";

import { os } from "./os";
import { apiKeyMiddleware, authenticatedMiddleware } from "./middleware";

const UPLOAD_URL_TTL_SECONDS = 3600;

const getSnapshotDisplayStatus = (
  snapshot: SnapshotDbSchema,
  diff: DiffDbSchema | undefined,
): SnapshotDisplayStatus => {
  if (snapshot.status === "error" || snapshot.hasRenderError) {
    return "fail";
  }

  if (snapshot.status === "pending" || !diff || diff.processingStatus === "pending") {
    return "pending";
  }

  if (diff.processingStatus === "error") {
    return "fail";
  }

  if (diff.reviewStatus === "rejected") {
    return "rejected";
  }

  if (diff.reviewStatus === "needs_review") {
    return "changed";
  }

  return "pass";
};

export const createBuild = os.builds.createBuild
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const result = await createBuildService(
      {
        projectId: context.projectId,
        branch: input.branch,
        commitSha: input.commitSha,
        name: input.name,
        author: input.author,
        targets: input.targets,
        viewports: input.viewports,
      },
      context.apiKey.referenceId,
    );

    if (result.status === "error") {
      throw new ORPCError("NOT_FOUND");
    }

    const uploadUrl = await storage.getPresignedUploadUrl(
      getArtifactPath(result.data),
      UPLOAD_URL_TTL_SECONDS,
    );

    return { buildId: result.data, uploadUrl };
  })
  .actionable();

export const getBuildStatus = os.builds.getBuildStatus
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const build = await dbClient.builds.findById(input.buildId);

    if (!build) {
      throw new ORPCError("NOT_FOUND");
    }

    if (build.projectId !== context.projectId) {
      throw new ORPCError("FORBIDDEN");
    }

    if (build.status === "needs_review") {
      const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
      return {
        status: build.status,
        reviewUrl: `${baseUrl}/projects/${build.projectId}/builds/${build.id}`,
      };
    }

    if (build.status === "error") {
      return { status: build.status, errorMessage: build.errorMessage ?? undefined };
    }

    return { status: build.status };
  })
  .actionable();

export const list = os.builds.list
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { projectIds, status, sortDirection = "desc", limit = 20, offset = 0 } = input ?? {};

    const { builds: rows, total } = await dbClient.builds.findAll({
      organizationId: context.organizationId,
      projectIds,
      status,
      sortDirection,
      limit,
      offset,
    });

    return {
      builds: rows.map((build) => ({
        id: build.id,
        project: { id: build.projectId, name: build.projectName },
        branch: build.branch,
        commitSha: build.commitSha,
        name: build.name,
        author: build.author,
        status: build.status,
        createdAt: build.createdAt,
      })),
      total,
    };
  })
  .actionable();

export const getOne = os.builds.getOne
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
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

    const [snapshots, diffs] = await Promise.all([
      dbClient.snapshots.findByBuild(build.id),
      dbClient.diffs.findByBuild(build.id),
    ]);

    const diffBySnapshotId = new Map(diffs.map((diff) => [diff.snapshotId, diff]));

    return {
      build: {
        id: build.id,
        project: { id: project.id, name: project.name },
        branch: build.branch,
        commitSha: build.commitSha,
        name: build.name,
        author: build.author,
        status: build.status,
        createdAt: build.createdAt,
      },
      snapshots: snapshots.map((snapshot) => {
        const diff = diffBySnapshotId.get(snapshot.id);

        return {
          id: snapshot.id,
          targetId: snapshot.targetId,
          targetTitle: snapshot.targetTitle,
          targetName: snapshot.targetName,
          status: getSnapshotDisplayStatus(snapshot, diff),
          imagePath: snapshot.imagePath,
          diffId: diff?.id ?? null,
          diffImagePath: diff?.diffImagePath ?? null,
          diffPercent: diff?.diffPercent ?? null,
          browser: snapshot.browser,
          viewportWidth: snapshot.viewportWidth,
          viewportHeight: snapshot.viewportHeight === 0 ? null : snapshot.viewportHeight,
        };
      }),
    };
  })
  .actionable();
