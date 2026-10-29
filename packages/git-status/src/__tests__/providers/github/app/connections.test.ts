import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { githubAppConnections as connections } from "../../../../providers/github/app/connections";
import { clearInstallationTokens } from "../../../../providers/github/app/tokens";
import { server } from "../../../setup";
import { TEST_CLIENT_ID, useFakeGithub } from "./fakeGithub";
import { TEST_PRIVATE_KEY_PEM } from "./testKeys";

const API = "https://api.github.com";

const installations = [
  {
    id: 42,
    account: { login: "acme", type: "Organization" as const },
    repositories: [
      { id: 7, fullName: "acme/web", private: true },
      { id: 8, fullName: "acme/api", private: false },
    ],
  },
  {
    id: 43,
    account: { login: "acme-labs", type: "Organization" as const },
    repositories: [{ id: 9, fullName: "acme-labs/app", private: true }],
  },
  {
    id: 44,
    account: { login: "dormant", type: "User" as const },
    suspended: true,
    repositories: [{ id: 10, fullName: "dormant/old", private: true }],
  },
];

beforeEach(() => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", TEST_CLIENT_ID);
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
});

afterEach(() => {
  clearInstallationTokens();
});

const notConfigured = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
};

describe("isConfigured", () => {
  it("is true only when the app's settings are present", () => {
    expect(connections.isConfigured()).toBe(true);
    notConfigured();
    expect(connections.isConfigured()).toBe(false);
  });
});

describe("status", () => {
  it("reports when no app is configured", async () => {
    notConfigured();
    expect(await connections.status()).toEqual({ status: "not_configured" });
  });

  it("describes the app and each installation", async () => {
    useFakeGithub({ installations, app: { slug: "acme-ovr", ownerLogin: "acme" } });

    expect(await connections.status()).toEqual({
      status: "ok",
      name: "acme-ovr",
      description: "owned by acme · commit statuses: write",
      manageUrl: "https://github.com/apps/acme-ovr",
      addUrl: "https://github.com/apps/acme-ovr/installations/new",
      warnings: [],
      connections: [
        {
          id: "42",
          name: "acme",
          description: "organization",
          manageUrl: "https://github.com/organizations/acme/settings/installations/42",
          repositoryCount: 2,
          warnings: [],
        },
        {
          id: "43",
          name: "acme-labs",
          description: "organization",
          manageUrl: "https://github.com/organizations/acme-labs/settings/installations/43",
          repositoryCount: 1,
          warnings: [],
        },
        {
          id: "44",
          name: "dormant",
          description: "user",
          manageUrl: "https://github.com/organizations/dormant/settings/installations/44",
          repositoryCount: null,
          warnings: ["suspended"],
        },
      ],
    });
  });

  it("warns when the app can't write commit statuses", async () => {
    useFakeGithub({ installations, app: { permissions: { metadata: "read" } } });

    expect(await connections.status()).toMatchObject({
      status: "ok",
      description: "owned by acme · commit statuses: no access",
      warnings: [expect.stringMatching(/can't write commit statuses/)],
    });
  });

  it("explains rejected app credentials", async () => {
    useFakeGithub({ clientId: "Iv23liSomeoneElse" });

    expect(await connections.status()).toEqual({
      status: "error",
      error:
        "github rejected the app's credentials, check OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY",
    });
  });
});

describe("searchRepositories", () => {
  it("lists repositories across active installations, sorted by name", async () => {
    useFakeGithub({ installations });

    const page = await connections.searchRepositories({});
    expect(page).toEqual({
      repositories: [
        { connectionId: "43", id: "9", fullName: "acme-labs/app", private: true },
        { connectionId: "42", id: "8", fullName: "acme/api", private: false },
        { connectionId: "42", id: "7", fullName: "acme/web", private: true },
      ],
      nextCursor: null,
    });
  });

  it("filters by name and by connection", async () => {
    useFakeGithub({ installations });

    expect(await connections.searchRepositories({ query: "WEB" })).toMatchObject({
      repositories: [{ fullName: "acme/web" }],
    });
    expect(await connections.searchRepositories({ connectionId: "43" })).toMatchObject({
      repositories: [{ fullName: "acme-labs/app" }],
    });
  });

  it("pages through large installations", async () => {
    useFakeGithub({
      installations: [
        {
          id: 42,
          account: { login: "acme", type: "Organization" },
          repositories: Array.from({ length: 120 }, (_, index) => ({
            id: index + 1,
            fullName: `acme/repo-${String(index).padStart(3, "0")}`,
            private: false,
          })),
        },
      ],
    });

    const first = await connections.searchRepositories({});
    expect(first).toMatchObject({ nextCursor: "50" });
    const last = await connections.searchRepositories({ cursor: "100" });
    expect(last).toMatchObject({ nextCursor: null });
    expect("repositories" in last && last.repositories).toHaveLength(20);
  });

  it("explains when no app is configured", async () => {
    notConfigured();
    expect(await connections.searchRepositories({})).toEqual({
      error: "github app is not configured on this instance",
    });
  });
});

describe("getRepository", () => {
  it("returns a repository the installation has been granted", async () => {
    useFakeGithub({ installations });

    expect(await connections.getRepository("42", "7")).toEqual({
      connectionId: "42",
      id: "7",
      fullName: "acme/web",
      private: true,
    });
  });

  it("refuses a repository from another installation", async () => {
    useFakeGithub({ installations });

    expect(await connections.getRepository("42", "9")).toEqual({
      error: "the github app installation can't access that repository",
    });
  });
});

describe("credential", () => {
  it("mints a token scoped to the repository's commit statuses", async () => {
    const fake = useFakeGithub({ installations });

    expect(await connections.credential("42", "7", "acme/web")).toMatchObject({ ok: true });
    expect(fake.requests().tokenRequests).toEqual([
      {
        installationId: 42,
        repository_ids: [7],
        permissions: { statuses: "write", metadata: "read" },
      },
    ]);
  });

  it("renews by minting a fresh token instead of the cached one", async () => {
    const fake = useFakeGithub({ installations });

    const first = await connections.credential("42", "7", "acme/web");
    await connections.credential("42", "7", "acme/web");
    expect(fake.requests().tokenRequests).toHaveLength(1);

    if (!first.ok || !first.renew) {
      throw new Error("expected a renewable credential");
    }
    const renewed = await first.renew();
    expect(renewed.ok && renewed.token).not.toBe(first.token);
    expect(fake.requests().tokenRequests).toHaveLength(2);
  });

  it.each([
    [401, /rejected the app's credentials/, false],
    [404, /no longer installed/, false],
    [403, /can't write commit statuses to acme\/web/, false],
    [422, /can't write commit statuses to acme\/web/, false],
    [500, /github responded with 500/, true],
    [429, /github responded with 429/, true],
  ])("explains a %i from github", async (status, error, retryable) => {
    const fake = useFakeGithub({ installations });
    fake.failNext({ method: "POST", path: "/app/installations/42/access_tokens", status });

    expect(await connections.credential("42", "7", "acme/web")).toMatchObject({
      ok: false,
      error,
      retryable,
    });
  });

  it("is refused for a repository the installation doesn't have", async () => {
    useFakeGithub({ installations });

    expect(await connections.credential("42", "9", "acme-labs/app")).toMatchObject({
      ok: false,
      error: /can't write commit statuses to acme-labs\/app/,
    });
  });

  it("retries later when github can't be reached", async () => {
    server.use(http.post(`${API}/app/installations/42/access_tokens`, () => HttpResponse.error()));

    expect(await connections.credential("42", "7", "acme/web")).toMatchObject({
      ok: false,
      retryable: true,
    });
  });

  it("refuses ids that aren't github ids", async () => {
    expect(await connections.credential("acme", "7", "acme/web")).toMatchObject({
      ok: false,
      error: /installation is invalid/,
    });
  });
});

describe("verify", () => {
  it("is ok when the name still points at the linked repository", async () => {
    useFakeGithub({ installations });
    const minted = await connections.credential("42", "7", "acme/web");
    if (!minted.ok) {
      throw new Error("expected a token");
    }

    expect(await connections.verify("acme/web", "7", minted.token)).toEqual({
      ok: true,
      httpStatus: 200,
      error: null,
    });
  });

  it("fails when the name now points at a different repository", async () => {
    server.use(http.get(`${API}/repos/acme/web`, () => HttpResponse.json({ id: 99 })));

    expect(await connections.verify("acme/web", "7", "ghs_token")).toMatchObject({
      ok: false,
      error: /points at a different repository/,
    });
  });
});
