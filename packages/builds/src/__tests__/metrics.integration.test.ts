import assert from "node:assert";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import {
  cancelBuild,
  confirmBuildUpload,
  createBuild,
  failBuild,
  finalizeBuild,
  getArtifactPath,
  rebuildBuild,
} from "../builds";
import { resolveStaleBuilds } from "../reaper";
import { describe, expect, test } from "./fixtures";

const OLD_TIMESTAMP = "2020-01-01T00:00:00.000Z";

describe("build metrics", () => {
  test("should count an uploaded build as created", async ({ project, user, metrics }) => {
    await createBuild(
      { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
      user.id,
    );

    expect(await metrics.scrape()).toContain(
      'ovr_builds_created_total{build_type="storybook",trigger="upload"} 1',
    );
  });

  test("should not count a retried upload of the same build twice", async ({
    project,
    user,
    metrics,
  }) => {
    const input = { projectId: project.id, branch: "main", commitSha: "a".repeat(40) };
    const created = await createBuild(input, user.id);
    assert(created.status === "ok");

    await createBuild({ ...input, buildId: created.data }, user.id);

    expect(await metrics.scrape()).toContain(
      'ovr_builds_created_total{build_type="storybook",trigger="upload"} 1',
    );
  });

  test("should count a rebuild as created by a rebuild", async ({ project, user, metrics }) => {
    const created = await createBuild(
      { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
      user.id,
    );
    assert(created.status === "ok");
    await storage.uploadFile(
      getArtifactPath(project.id, created.data),
      Buffer.from(""),
      "application/gzip",
    );
    await confirmBuildUpload(created.data, {
      targets: [{ id: "story-a", title: "Story", name: "A" }],
      viewports: [{ name: "desktop", browser: "chromium", viewportWidth: 1280 }],
      diffThreshold: 0,
    });
    await dbClient.builds.updateProcessingStatus(created.data, "success");

    await rebuildBuild(created.data, user.id);

    expect(await metrics.scrape()).toContain(
      'ovr_builds_created_total{build_type="storybook",trigger="rebuild"} 1',
    );
  });

  test("should count a finalized build once with how long it took", async ({
    mainBuild,
    metrics,
  }) => {
    await dbClient.builds.updateProcessingStatus(mainBuild.id, "processing");

    await finalizeBuild(mainBuild.id);
    await finalizeBuild(mainBuild.id);

    const body = await metrics.scrape();

    expect(body).toContain(
      'ovr_builds_finished_total{processing_status="success",reason="finalized"} 1',
    );
    expect(body).toContain('ovr_build_duration_seconds_count{processing_status="success"} 1');
  });

  test("should count a canceled build", async ({ featureBuild, user, metrics }) => {
    await cancelBuild(featureBuild.id, user.id);

    expect(await metrics.scrape()).toContain(
      'ovr_builds_finished_total{processing_status="canceled",reason="canceled"} 1',
    );
  });

  test("should count a build superseded by a newer build on its branch", async ({
    project,
    user,
    metrics,
  }) => {
    const input = { projectId: project.id, branch: "feature/checkout" };
    await createBuild({ ...input, commitSha: "a".repeat(40) }, user.id);
    await createBuild({ ...input, commitSha: "b".repeat(40) }, user.id);

    expect(await metrics.scrape()).toContain(
      'ovr_builds_finished_total{processing_status="canceled",reason="superseded"} 1',
    );
  });

  test("should count a failed build with why it failed", async ({ mainBuild, metrics }) => {
    await failBuild(mainBuild.id, "extract crashed", "extract_failed");

    expect(await metrics.scrape()).toContain(
      'ovr_builds_finished_total{processing_status="error",reason="extract_failed"} 1',
    );
    expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
      processingStatus: "error",
      errorMessage: "extract crashed",
    });
  });

  test("should count a stale build the reaper resolved as timed out", async ({
    project,
    user,
    metrics,
  }) => {
    const build = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      artifactPath: "builds/stalled/artifact",
      createdBy: user.id,
      createdAt: OLD_TIMESTAMP,
      updatedAt: OLD_TIMESTAMP,
    });
    await dbClient.builds.updateProcessingStatus(build!.id, "processing");

    await resolveStaleBuilds(30);

    expect(await metrics.scrape()).toContain(
      'ovr_builds_finished_total{processing_status="error",reason="timed_out"} 1',
    );
  });
});
