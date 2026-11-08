import { http, HttpResponse } from "msw";
import { it, vi } from "vitest";

import { resolveAdapter } from "../adapters";
import { resolveToken } from "../auth";
import { createGitHubAppAuth } from "../authMethods/githubApp";
import { encryptToken } from "../crypto";
import {
  GitStatusPublishError,
  publishBuildStatus,
  type PublishBuildStatusDeps,
} from "../publishBuildStatus";
import { send } from "../publisher";
import { describe, expect, test } from "./fixtures";
import { server } from "./setup";

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
  authType: "token" as const,
  encryptedToken: "encrypted",
  checkContext: "ovr/visual-review",
  statusChecksEnabled: true,
};

const appIntegration = { ...integration, authType: "github_app" as const, encryptedToken: null };

const makeDeps = (overrides: Partial<PublishBuildStatusDeps> = {}): PublishBuildStatusDeps => ({
  findBuild: vi.fn<PublishBuildStatusDeps["findBuild"]>().mockResolvedValue(build),
  findIntegration: vi
    .fn<PublishBuildStatusDeps["findIntegration"]>()
    .mockResolvedValue(integration),
  recordPublication: vi
    .fn<PublishBuildStatusDeps["recordPublication"]>()
    .mockResolvedValue(undefined),
  resolveAdapter,
  resolveToken: vi
    .fn<PublishBuildStatusDeps["resolveToken"]>()
    .mockResolvedValue({ ok: true, token: "plain-token" }),
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

  test("records a terminal error without sending when the stored token can't be decrypted", async ({
    encryptionKey: _,
  }) => {
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue({ ...integration, encryptedToken: "not-a-ciphertext" }),
      resolveToken,
    });

    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();

    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "error",
        httpStatus: null,
        error: "stored token could not be decrypted, re-enter it",
      }),
    );
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

  test("publishes as a GitHub App installation", async ({ githubApp, github }) => {
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken: createGitHubAppAuth({ config: githubApp }).resolveToken,
      send,
    });

    await publishBuildStatus("build-1", deps);

    expect(github.statusTokens).toEqual(["ghs_1"]);
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "ok", httpStatus: 201 }),
    );
  });

  test("retries once with a fresh App token when GitHub rejects the cached one", async ({
    githubApp,
    github,
  }) => {
    github.rejectedTokens.add("ghs_1");
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken: createGitHubAppAuth({ config: githubApp }).resolveToken,
      send,
    });

    await publishBuildStatus("build-1", deps);

    expect(github.statusTokens).toEqual(["ghs_1", "ghs_2"]);
    expect(deps.recordPublication).toHaveBeenCalledOnce();
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "ok", httpStatus: 201 }),
    );
  });

  test("records the error when GitHub rejects the fresh App token too", async ({
    githubApp,
    github,
  }) => {
    github.rejectedTokens.add("ghs_1").add("ghs_2");
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken: createGitHubAppAuth({ config: githubApp }).resolveToken,
      send,
    });

    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();

    expect(github.statusTokens).toEqual(["ghs_1", "ghs_2"]);
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "error", httpStatus: 401 }),
    );
  });

  test("does not retry when GitHub rejects a stored token", async ({
    encryptionKey: _,
    github,
  }) => {
    github.rejectedTokens.add("ghp_revoked");
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue({ ...integration, encryptedToken: encryptToken("ghp_revoked") }),
      resolveToken,
      send,
    });

    await publishBuildStatus("build-1", deps);

    expect(github.statusTokens).toEqual(["ghp_revoked"]);
  });

  test("throws so the job retries when GitHub is down while minting an App token", async ({
    githubApp,
  }) => {
    server.use(
      http.get(
        "https://api.github.com/repos/acme/web/installation",
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken: createGitHubAppAuth({ config: githubApp }).resolveToken,
      send,
    });

    await expect(publishBuildStatus("build-1", deps)).rejects.toBeInstanceOf(GitStatusPublishError);
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "error", httpStatus: null }),
    );
  });

  test("records a terminal error when the App is not installed on the repo", async ({
    githubApp,
    github,
  }) => {
    github.installedOn = "someone-else";
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken: createGitHubAppAuth({ config: githubApp }).resolveToken,
      send,
    });

    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();

    expect(github.statusTokens).toEqual([]);
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "error",
        error: "the GitHub App is not installed on acme/web",
      }),
    );
  });

  it("records a terminal error when the deployment has no GitHub App", async () => {
    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue(appIntegration),
      resolveToken,
      send,
    });

    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();

    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "error",
        error: expect.stringMatching(/set OVR_GITHUB_APP_ID and OVR_GITHUB_APP_PRIVATE_KEY_FILE/),
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
      encryptionKey: _,
    }) => {
      const deps = makeDeps({
        findIntegration: vi
          .fn<PublishBuildStatusDeps["findIntegration"]>()
          .mockResolvedValue({ ...integration, encryptedToken: "not-a-ciphertext" }),
        resolveToken,
      });
      await publishBuildStatus("build-1", deps);

      expect(await metrics.scrape()).toContain(
        'ovr_git_status_publications_total{provider="github",state="failure",outcome="error"} 1',
      );
    });
  });
});
