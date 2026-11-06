import { generateKeyPairSync } from "node:crypto";

import { http, HttpResponse } from "msw";
import { it, vi } from "vitest";

import { resolveAdapter } from "../adapters";
import { readGitHubAppConfig } from "../githubApp/config";
import { createInstallationTokenProvider } from "../githubApp/installationTokens";
import {
  GitStatusPublishError,
  publishBuildStatus,
  type PublishBuildStatusDeps,
} from "../publishBuildStatus";
import { send } from "../publisher";
import { resolveToken } from "../resolveToken";
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

  it("records a terminal error without sending when no token can be resolved", async () => {
    const deps = makeDeps({
      resolveToken: vi
        .fn<PublishBuildStatusDeps["resolveToken"]>()
        .mockResolvedValue({ ok: false, error: "bad key", retryable: false }),
    });
    await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "error", httpStatus: null, error: "bad key" }),
    );
  });

  it("throws so the job retries when resolving the token failed transiently", async () => {
    const deps = makeDeps({
      resolveToken: vi
        .fn<PublishBuildStatusDeps["resolveToken"]>()
        .mockResolvedValue({ ok: false, error: "provider is down", retryable: true }),
    });
    await expect(publishBuildStatus("build-1", deps)).rejects.toBeInstanceOf(GitStatusPublishError);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "error", error: "provider is down" }),
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

  describe("when GitHub rejects the token", () => {
    const unauthorized = { outcome: "error" as const, httpStatus: 401, retryable: false };
    const created = { outcome: "ok" as const, httpStatus: 201, retryable: false };

    it("drops a cached App token and retries once with a fresh one", async () => {
      const invalidate = vi.fn<() => void>();
      const deps = makeDeps({
        resolveToken: vi
          .fn<PublishBuildStatusDeps["resolveToken"]>()
          .mockResolvedValueOnce({ ok: true, token: "stale", invalidate })
          .mockResolvedValueOnce({ ok: true, token: "fresh", invalidate }),
        send: vi
          .fn<PublishBuildStatusDeps["send"]>()
          .mockResolvedValueOnce(unauthorized)
          .mockResolvedValueOnce(created),
      });
      await publishBuildStatus("build-1", deps);

      expect(invalidate).toHaveBeenCalledOnce();
      expect(deps.send).toHaveBeenCalledTimes(2);
      expect(deps.send).toHaveBeenLastCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ authorization: "Bearer fresh" }),
        }),
      );
      expect(deps.recordPublication).toHaveBeenCalledOnce();
      expect(deps.recordPublication).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: "ok", httpStatus: 201 }),
      );
    });

    it("records the error when the retry is rejected too", async () => {
      const deps = makeDeps({
        resolveToken: vi
          .fn<PublishBuildStatusDeps["resolveToken"]>()
          .mockResolvedValue({ ok: true, token: "t", invalidate: vi.fn<() => void>() }),
        send: vi.fn<PublishBuildStatusDeps["send"]>().mockResolvedValue(unauthorized),
      });
      await expect(publishBuildStatus("build-1", deps)).resolves.toBeUndefined();

      expect(deps.send).toHaveBeenCalledTimes(2);
      expect(deps.recordPublication).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: "error", httpStatus: 401 }),
      );
    });

    it("does not retry with a static token", async () => {
      const deps = makeDeps({
        send: vi.fn<PublishBuildStatusDeps["send"]>().mockResolvedValue(unauthorized),
      });
      await publishBuildStatus("build-1", deps);

      expect(deps.send).toHaveBeenCalledOnce();
    });
  });

  it("publishes for a GitHub App integration end to end", async () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const config = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY: privateKey,
    })!;
    const tokens = createInstallationTokenProvider({ config, apiBase: "https://api.github.com" });
    const statusAuth = vi.fn<(authorization: string | null) => void>();
    server.use(
      http.get("https://api.github.com/repos/acme/web/installation", () =>
        HttpResponse.json({ id: 42, permissions: { statuses: "write" } }),
      ),
      http.post("https://api.github.com/app/installations/42/access_tokens", () =>
        HttpResponse.json(
          { token: "ghs_installation", expires_at: new Date(Date.now() + 3_600_000).toISOString() },
          { status: 201 },
        ),
      ),
      http.post("https://api.github.com/repos/acme/web/statuses/abc123", ({ request }) => {
        statusAuth(request.headers.get("authorization"));
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const deps = makeDeps({
      findIntegration: vi
        .fn<PublishBuildStatusDeps["findIntegration"]>()
        .mockResolvedValue({ ...integration, authType: "github_app", encryptedToken: null }),
      resolveToken: (source) =>
        resolveToken(source, { tryDecryptToken: () => null, githubAppTokens: () => tokens }),
      send,
    });
    await publishBuildStatus("build-1", deps);

    expect(statusAuth).toHaveBeenCalledWith("Bearer ghs_installation");
    expect(deps.recordPublication).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "ok", httpStatus: 201 }),
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
        resolveToken: vi
          .fn<PublishBuildStatusDeps["resolveToken"]>()
          .mockResolvedValue({ ok: false, error: "undecryptable", retryable: false }),
      });
      await publishBuildStatus("build-1", deps);

      expect(await metrics.scrape()).toContain(
        'ovr_git_status_publications_total{provider="github",state="failure",outcome="error"} 1',
      );
    });
  });
});
