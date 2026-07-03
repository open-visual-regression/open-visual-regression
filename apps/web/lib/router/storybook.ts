"use server";

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { ORPCError } from "@orpc/client";

import { getBundleDir } from "@ovr/builds/storybookBundleCache";
import { getContentType } from "@ovr/storage/content-type";

import { authenticatedMiddleware, organizationBuildMiddleware } from "./middleware";
import { os } from "./os";

export const getStorybookFile = os.storybook.getStorybookFile
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input, context }) => {
    if (context.build.buildType !== "storybook") {
      throw new ORPCError("NOT_FOUND");
    }

    const relativePath = path.posix.normalize(input.path);

    if (path.posix.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
      throw new ORPCError("FORBIDDEN");
    }

    const bundleDir = await getBundleDir(context.build.id, context.build.artifactPath);
    const filePath = path.join(bundleDir, relativePath);

    if (filePath !== bundleDir && !filePath.startsWith(bundleDir + path.sep)) {
      throw new ORPCError("FORBIDDEN");
    }

    const stats = await stat(filePath).catch(() => null);

    if (!stats?.isFile()) {
      throw new ORPCError("NOT_FOUND");
    }

    return {
      status: 200 as const,
      headers: {
        "content-type": getContentType(relativePath),
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: Readable.toWeb(createReadStream(filePath)) as ReadableStream,
    };
  })
  .actionable();
