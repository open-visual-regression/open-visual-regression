import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { headers } from "next/headers";
import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { auth } from "@/lib/auth/auth";
import { getStorybookStaticKey } from "@/lib/utils/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain",
};

const getContentType = (filePath: string) =>
  CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

const SENTINEL = ".ready";

const uploadExtractedBundle = async (
  artifactPath: string,
  projectId: string,
  buildId: string,
): Promise<void> => {
  const workDir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-"));
  const tarballPath = path.join(workDir, "artifact.tar.gz");
  const bundleDir = path.join(workDir, "bundle");

  try {
    const artifactStream = await storage.getFileStream(artifactPath);
    await pipeline(artifactStream, createWriteStream(tarballPath));
    await mkdir(bundleDir, { recursive: true });
    await tar.x({ file: tarballPath, cwd: bundleDir, gzip: true });

    const uploadFile = async (dir: string): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true });
      await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            return uploadFile(fullPath);
          }
          const relativePath = path.relative(bundleDir, fullPath);
          const key = getStorybookStaticKey(projectId, buildId, relativePath);
          const body = await readFile(fullPath);
          await storage.uploadFile(key, body, getContentType(entry.name));
        }),
      );
    };

    await uploadFile(bundleDir);
    await storage.uploadFile(
      getStorybookStaticKey(projectId, buildId, SENTINEL),
      Buffer.from(""),
      "text/plain",
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

type RouteParams = { projectId: string; buildId: string; path: string[] };

export const GET = async (
  _request: Request,
  { params }: { params: Promise<RouteParams> },
): Promise<Response> => {
  const { projectId, buildId, path: pathSegments } = await params;

  const relativePath = path.posix.normalize(pathSegments.join("/"));

  if (
    relativePath === ".." ||
    relativePath.startsWith("../") ||
    path.posix.isAbsolute(relativePath)
  ) {
    return new Response(null, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return new Response(null, { status: 401 });
  }

  const project = await dbClient.projects.getProject({ projectId, organizationId });

  if (!project) {
    return new Response(null, { status: 403 });
  }

  const build = await dbClient.builds.findById(buildId);

  if (!build || build.projectId !== projectId) {
    return new Response(null, { status: 404 });
  }

  const sentinelKey = getStorybookStaticKey(projectId, buildId, SENTINEL);
  const fileKey = getStorybookStaticKey(projectId, buildId, relativePath);

  // Check if files have already been extracted to storage.
  let sentinelExists = false;
  try {
    await storage.getFileStream(sentinelKey);
    sentinelExists = true;
  } catch {
    // Not yet extracted.
  }

  if (!sentinelExists) {
    try {
      await uploadExtractedBundle(build.artifactPath, projectId, buildId);
    } catch {
      return new Response(null, { status: 404 });
    }
  }

  try {
    const stream = await storage.getFileStream(fileKey);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: { "Content-Type": getContentType(relativePath) },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
