import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import {
  createInstallationToken,
  getApp,
  GithubAppRequestError,
  listInstallationRepositories,
  listInstallations,
} from "../../../../providers/github/app/client";
import { server } from "../../../setup";
import { testAppConfig, useFakeGithub } from "./fakeGithub";

const API = "https://api.github.com";

describe("getApp", () => {
  it("authenticates as the app and returns its registration", async () => {
    useFakeGithub({ app: { slug: "acme-ovr", ownerLogin: "acme" } });

    expect(await getApp(testAppConfig)).toEqual({
      slug: "acme-ovr",
      name: "acme-ovr",
      htmlUrl: "https://github.com/apps/acme-ovr",
      ownerLogin: "acme",
      permissions: { statuses: "write", metadata: "read" },
    });
  });

  it("uses OVR_GITHUB_API_URL when it is set", async () => {
    vi.stubEnv("OVR_GITHUB_API_URL", "http://github.test/");
    useFakeGithub({ baseUrl: "http://github.test" });

    expect((await getApp(testAppConfig)).slug).toBe("acme-ovr");
  });

  it("is rejected when the JWT is signed by another app", async () => {
    useFakeGithub({ clientId: "Iv23liSomeoneElse" });

    const error = await getApp(testAppConfig).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GithubAppRequestError);
    expect(error).toMatchObject({ status: 401, message: "github responded with 401" });
  });

  it("throws when github returns something unexpected", async () => {
    server.use(http.get(`${API}/app`, () => HttpResponse.json({ nope: true })));

    await expect(getApp(testAppConfig)).rejects.toMatchObject({
      status: 200,
      message: "github returned an unexpected response",
    });
  });

  it("throws without a status when github can't be reached", async () => {
    server.use(http.get(`${API}/app`, () => HttpResponse.error()));

    await expect(getApp(testAppConfig)).rejects.toMatchObject({ status: null });
  });
});

describe("listInstallations", () => {
  it("returns every installation across pages", async () => {
    useFakeGithub({
      installations: Array.from({ length: 101 }, (_, index) => ({
        id: index + 1,
        account: { login: `org-${index}`, type: "Organization" as const },
        suspended: index === 100,
        repositories: [],
      })),
    });

    const installations = await listInstallations(testAppConfig);
    expect(installations).toHaveLength(101);
    expect(installations.at(-1)).toEqual({
      id: 101,
      accountLogin: "org-100",
      accountType: "Organization",
      htmlUrl: "https://github.com/organizations/org-100/settings/installations/101",
      repositorySelection: "selected",
      permissions: { statuses: "write", metadata: "read" },
      suspended: true,
    });
  });
});

describe("createInstallationToken", () => {
  it("asks for a token narrowed to the repositories and permissions", async () => {
    const fake = useFakeGithub();

    const token = await createInstallationToken(testAppConfig, 42, {
      repositoryIds: [7],
      permissions: { statuses: "write" },
    });

    expect(fake.requests().tokenRequests).toEqual([
      { installationId: 42, repository_ids: [7], permissions: { statuses: "write" } },
    ]);
    expect(token.token).toMatch(/^ghs_/);
    expect(token.expiresAt).toBeGreaterThan(Date.now());
  });

  it("is refused for a repository outside the installation", async () => {
    useFakeGithub();

    await expect(
      createInstallationToken(testAppConfig, 42, {
        repositoryIds: [999],
        permissions: { statuses: "write" },
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe("listInstallationRepositories", () => {
  it("lists the repositories the installation token can reach", async () => {
    useFakeGithub();
    const { token } = await createInstallationToken(testAppConfig, 42, {
      repositoryIds: [7],
      permissions: { metadata: "read" },
    });

    expect(await listInstallationRepositories(token)).toEqual([
      { id: 7, fullName: "acme/web", private: true },
    ]);
  });
});
