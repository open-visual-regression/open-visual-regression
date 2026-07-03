"use server";

import { ORPCError } from "@orpc/client";

import {
  confirmBuildUpload,
  createBuild as createBuildService,
  DEFAULT_DIFF_THRESHOLD,
  getArtifactPath,
} from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import {
  apiKeyMiddleware,
  authenticatedMiddleware,
  organizationBuildMiddleware,
} from "./middleware";
import { os } from "./os";
import { getBuildDisplayStatus } from "./utils/buildStatus";

const UPLOAD_URL_TTL_SECONDS = 3600;

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
      },
      context.apiKey.referenceId,
    );

    if (result.status === "error") {
      throw new ORPCError("NOT_FOUND");
    }

    const uploadUrl = await storage.getPresignedUploadUrl(
      getArtifactPath(context.projectId, result.data),
      UPLOAD_URL_TTL_SECONDS,
    );

    return { buildId: result.data, uploadUrl };
  })
  .actionable();

export const confirmUpload = os.builds.confirmUpload
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const build = await dbClient.builds.findById(input.buildId);

    if (!build || build.projectId !== context.projectId) {
      throw new ORPCError("NOT_FOUND");
    }

    const result = await confirmBuildUpload(input.buildId, {
      targets: input.targets,
      viewports: input.viewports,
      diffThreshold: input.diffThreshold ?? DEFAULT_DIFF_THRESHOLD,
    });

    if (result.status === "error") {
      throw new ORPCError(
        result.error === "ARTIFACT_MISSING" ? "PRECONDITION_FAILED" : "NOT_FOUND",
      );
    }

    return { ok: true as const };
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

    const status = getBuildDisplayStatus(build);

    if (status === "needs_review") {
      const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
      return {
        status,
        reviewUrl: `${baseUrl}/projects/${build.projectId}/builds/${build.id}`,
      };
    }

    if (status === "error") {
      return {
        status,
        errorMessage: build.errorMessage ?? undefined,
      };
    }

    return { status };
  })
  .actionable();

export const list = os.builds.list
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const {
      projectIds,
      processingStatus,
      reviewStatus,
      search,
      sortDirection = "desc",
      limit = 20,
      cursor,
    } = input ?? {};

    const {
      builds: rows,
      total,
      nextCursor,
    } = await dbClient.builds.findAll({
      organizationId: context.organizationId,
      projectIds,
      processingStatus,
      reviewStatus,
      search,
      sortDirection,
      limit,
      cursor,
    });

    return {
      builds: rows.map((build) => ({
        id: build.id,
        project: { id: build.projectId, name: build.projectName },
        branch: build.branch,
        errorMessage: build.errorMessage,
        commitSha: build.commitSha,
        name: build.name,
        author: build.author,
        status: getBuildDisplayStatus(build),
        buildType: build.buildType,
        createdAt: build.createdAt,
      })),
      total,
      nextCursor,
    };
  })
  .actionable();

export const getOne = os.builds.getOne
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ context }) => {
    const { build, project } = context;

    return {
      build: {
        id: build.id,
        project: { id: project.id, name: project.name },
        branch: build.branch,
        commitSha: build.commitSha,
        errorMessage: build.errorMessage,
        name: build.name,
        author: build.author,
        status: getBuildDisplayStatus(build),
        buildType: build.buildType,
        createdAt: build.createdAt,
      },
    };
  })
  .actionable();
