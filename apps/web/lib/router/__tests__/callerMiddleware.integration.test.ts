import { headers } from "next/headers";
import { vi } from "vitest";

import { db, sql } from "@ovr/db/db";
import { personalTokenMetadata } from "@ovr/db/repository/accessTokens";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PROJECT = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const asBearer = (token: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers({ authorization: `Bearer ${token}` }));
};

describe("callerMiddleware", () => {
  test("should return UNAUTHORIZED without a session or a token", async () => {
    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should let a session list builds", async ({ reviewer: _ }) => {
    const [error, result] = await serverClient.builds.list();
    expect(error).toBeNull();
    expect(result?.builds).toHaveLength(0);
  });

  test("should let a personal access token list builds", async ({ reviewer: _ }) => {
    const [, created] = await serverClient.accessTokens.create({ name: "cursor" });

    asBearer(created!.token);

    const [error, result] = await serverClient.builds.list();
    expect(error).toBeNull();
    expect(result?.builds).toHaveLength(0);
  });

  test("should return FORBIDDEN for a project api key, which cannot read builds", async ({
    admin: _,
  }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const [, key] = await serverClient.apiKeys.create({
      projectId: addResult!.projectId,
      name: "ci",
    });

    asBearer(key!.key);

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("FORBIDDEN");
  });

  test("should return FORBIDDEN for a key that reads builds but is not a personal token", async ({
    reviewer,
  }) => {
    const impostor = await auth.api.createApiKey({
      body: {
        name: "impostor",
        userId: reviewer.id,
        permissions: { builds: ["read"] },
        metadata: { projectId: "some-project" },
      },
    });

    asBearer(impostor.key);

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("FORBIDDEN");
  });

  test("should return FORBIDDEN for a personal token without the builds read scope", async ({
    reviewer,
  }) => {
    const scopeless = await auth.api.createApiKey({
      body: {
        name: "scopeless",
        prefix: "ovr_pat_",
        userId: reviewer.id,
        permissions: { reviews: ["write"] },
        metadata: personalTokenMetadata(),
      },
    });

    asBearer(scopeless.key);

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("FORBIDDEN");
  });

  test("should return UNAUTHORIZED for a token that is not a real key", async () => {
    asBearer("ovr_pat_not_a_real_token");

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should return UNAUTHORIZED for a revoked token", async ({ reviewer: _ }) => {
    const [, created] = await serverClient.accessTokens.create({ name: "cursor" });
    const [, list] = await serverClient.accessTokens.list({});
    await serverClient.accessTokens.revoke({ tokenId: list!.accessTokens[0]!.id });

    asBearer(created!.token);

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should return UNAUTHORIZED once the token owner is no longer an organization member", async ({
    reviewer,
  }) => {
    const [, created] = await serverClient.accessTokens.create({ name: "cursor" });

    asBearer(created!.token);
    const [beforeError] = await serverClient.builds.list();
    expect(beforeError).toBeNull();

    await db.execute(sql`DELETE FROM member WHERE user_id = ${reviewer.id}`);

    const [afterError] = await serverClient.builds.list();
    expect(afterError?.code).toBe("UNAUTHORIZED");
  });

  test("should let a token read a single build", async ({ admin: _ }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const [, key] = await serverClient.apiKeys.create({
      projectId: addResult!.projectId,
      name: "ci",
    });
    const [, token] = await serverClient.accessTokens.create({ name: "cursor" });

    const uploadHeaders = new Headers({ authorization: `Bearer ${key!.key}` });
    vi.mocked(headers).mockResolvedValue(uploadHeaders);
    const [, build] = await serverClient.builds.createBuild({
      branch: "main",
      commitSha: "abc123",
    });

    asBearer(token!.token);

    const [error, result] = await serverClient.builds.getOne({ buildId: build!.buildId });
    expect(error).toBeNull();
    expect(result?.build).toMatchObject({ branch: "main", commitSha: "abc123" });
  });

  test("should return NOT_FOUND for a build that does not exist", async ({ reviewer: _ }) => {
    const [, created] = await serverClient.accessTokens.create({ name: "cursor" });

    asBearer(created!.token);

    const [error] = await serverClient.builds.getOne({
      buildId: "01900000-0000-7000-8000-000000000000",
    });
    expect(error?.code).toBe("NOT_FOUND");
  });

  test("should not let a token created before the org existed reach builds", async () => {
    const orphan = await auth.api.createApiKey({
      body: {
        name: "orphan",
        prefix: "ovr_pat_",
        userId: "no-such-user",
        permissions: { builds: ["read"] },
        metadata: personalTokenMetadata(),
      },
    });

    asBearer(orphan.key);

    const [error] = await serverClient.builds.list();
    expect(error?.code).toBe("UNAUTHORIZED");
  });
});
