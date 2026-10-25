import { it, vi } from "vitest";

import { resolveAdapter } from "../adapters";
import {
  GitStatusPublishError,
  publishBuildStatus,
  type PublishBuildStatusDeps,
} from "../publishBuildStatus";
import { describe, expect, test } from "./fixtures";

const build = {
  id: "build-1",
  projectId: "project-1",
  commitSha: "abc123",
  processingStatus: "success" as const,
  reviewStatus: "needs_review" as const,
};

const integration = {
  provider: "github" as const,
  repoIdentifier: "acme/web",
  encryptedToken: "encrypted",
  checkContext: "ovr/visual-review",
  statusChecksEnabled: true,
};

const makeDeps = (overrides: Partial<PublishBuildStatusDeps> = {}): PublishBuildStatusDeps => ({
  findBuild: vi.fn<PublishBuildStatusDeps["findBuild"]>().mockResolvedValue(build),
  findIntegration: vi
    .fn<PublishBuildStatusDeps["findIntegration"]>()
    .mockResolvedValue(integration),
  recordPublication: vi
    .fn<PublishBuildStatusDeps["recordPublication"]>()
    .mockResolvedValue(undefined),
  resolveAdapter,
  tryDecryptToken: vi
    .fn<PublishBuildStatusDeps["tryDecryptToken"]>()
    .mockReturnValue("plain-token"),
  send: vi
    .fn<PublishBuildStatusDeps["send"]>()
    .mockResolvedValue({ outcome: "ok", httpStatus: 201, retryable: false }),
  baseUrl: "https://ovr.example.com",
  ...overrides,
});

describe("publishBuildStatus", () => {
  it("posts the mapped status and records a successful publication", async () => {
    const deps = makeDeps();
    await publishBuildStatus("build-1", deps);

    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.github.com/repos/acme/web/statuses/abc123",
        body: expect.objectContaining({
          state: "failure",
          target_url: "https://ovr.example.com/projects/project-1/builds/build-1",
        }),
      }),
    );
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ buildId: "build-1", state: "failure", outcome: "ok" }),
    );
  });

  it("skips when status checks are disabled", async () => {
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue({ ...integration, statusChecksEnabled: false }),
    });
    await publishBuildStatus("build-1", deps);

    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.recordPublication).not.toHaveBeenCalled();
  });

  it("skips when no integration is configured", async () => {
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(undefined),
    });
    await publishBuildStatus("build-1", deps);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.recordPublication).not.toHaveBeenCalled();
  });

  it("records but does not throw on a terminal error", async () => {
    const deps = makeDeps({
      send: vi
        .fn<PublishBuildStatusDeps["send"]>()
        .mockResolvedValue({ outcome: "error", httpStatus: 401, retryable: false }),
    });
    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "error", httpStatus: 401 }),
    );
  });

  it("throws on a retryable error so the job retries", async () => {
    const deps = makeDeps({
      send: vi
        .fn<PublishBuildStatusDeps["send"]>()
        .mockResolvedValue({ outcome: "error", httpStatus: 500, retryable: true }),
    });
    await expect(publishBuildStatus("build-1", deps)).rejects.toBeInstanceOf(GitStatusPublishError);
    expect(deps.recordPublication).toHaveBeenCalled();
  });

  it("never passes the encrypted token to the adapter", async () => {
    const deps = makeDeps();
    await publishBuildStatus("build-1", deps);
    expect(deps.send).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer plain-token" }),
      }),
    );
  });

  describe("metrics", () => {
    test("counts a sent status by provider, state, and outcome", async ({ metrics }) => {
      await publishBuildStatus("build-1", makeDeps());

      expect(await metrics.scrape()).toContain(
        'ovr_git_status_publications_total{provider="github",state="failure",outcome="ok"} 1',
      );
    });

    test("counts a status the provider rejected as an error", async ({ metrics }) => {
      const deps = makeDeps({
        send: vi
          .fn<PublishBuildStatusDeps["send"]>()
          .mockResolvedValue({ outcome: "error", httpStatus: 401, retryable: false }),
      });
      await publishBuildStatus("build-1", deps);

      expect(await metrics.scrape()).toContain(
        'ovr_git_status_publications_total{provider="github",state="failure",outcome="error"} 1',
      );
    });

    test("counts a status it could not send because the token would not decrypt", async ({
      metrics,
    }) => {
      const deps = makeDeps({
        tryDecryptToken: vi.fn<PublishBuildStatusDeps["tryDecryptToken"]>().mockReturnValue(null),
      });
      await publishBuildStatus("build-1", deps);

      expect(await metrics.scrape()).toContain(
        'ovr_git_status_publications_total{provider="github",state="failure",outcome="error"} 1',
      );
    });
  });
});
