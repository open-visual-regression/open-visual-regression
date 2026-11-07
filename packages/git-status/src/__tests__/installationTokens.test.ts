import { http, HttpResponse } from "msw";

import { createInstallationTokenProvider } from "../githubApp/installationTokens";
import { generateAppConfig } from "./fakeGitHub";
import { describe, expect, test } from "./fixtures";
import { server } from "./setup";

const API = "https://api.github.com";
const MINUTE = 60 * 1000;

describe("createInstallationTokenProvider", () => {
  test("mints a token for the repo's installation", async ({ githubApp, github }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    const { token } = await tokens.getToken("acme/web");

    expect(token).toBe("ghs_1");
    expect(github.lookups).toBe(1);
  });

  test("reuses a cached token until it has five minutes left", async ({
    githubApp,
    github,
    clock,
  }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await tokens.getToken("acme/web");
    clock.advance(50 * MINUTE);
    const cached = await tokens.getToken("acme/web");
    clock.advance(6 * MINUTE);
    const refreshed = await tokens.getToken("acme/web");

    expect([cached.token, refreshed.token]).toEqual(["ghs_1", "ghs_2"]);
    expect(github.lookups).toBe(1);
  });

  test("shares one token across repos on the same installation", async ({ githubApp, github }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await tokens.getToken("acme/web");
    await tokens.getToken("acme/api");

    expect(github.mintedTokens).toEqual(["ghs_1"]);
  });

  test("mints once for concurrent callers", async ({ githubApp, github }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    const results = await Promise.all([
      tokens.getToken("acme/web"),
      tokens.getToken("acme/web"),
      tokens.getToken("acme/web"),
    ]);

    expect(results.map((result) => result.token)).toEqual(["ghs_1", "ghs_1", "ghs_1"]);
    expect(github.lookups).toBe(1);
  });

  test("mints once for concurrent callers refreshing an expiring token", async ({
    githubApp,
    github,
    clock,
  }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await tokens.getToken("acme/web");
    clock.advance(56 * MINUTE);
    const results = await Promise.all([tokens.getToken("acme/web"), tokens.getToken("acme/web")]);

    expect(results.map((result) => result.token)).toEqual(["ghs_2", "ghs_2"]);
    expect(github.mintedTokens).toEqual(["ghs_1", "ghs_2"]);
  });

  test("mints a new token after the current one is invalidated", async ({
    githubApp,
    github: _,
  }) => {
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    const first = await tokens.getToken("acme/web");
    first.invalidate();
    const second = await tokens.getToken("acme/web");

    expect(second.token).toBe("ghs_2");
  });

  test("fails terminally when the App is not installed on the repo", async ({
    githubApp,
    github,
  }) => {
    github.installedOn = "someone-else";
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: false,
      httpStatus: 404,
      message: "the GitHub App is not installed on acme/web",
    });
  });

  test("fails terminally when GitHub rejects the App's key", async ({ github: _ }) => {
    const tokens = createInstallationTokenProvider({ config: generateAppConfig(), apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: false,
      httpStatus: 401,
      message: expect.stringMatching(/OVR_GITHUB_APP_ID/),
    });
  });

  test("retries a failed lookup instead of caching the failure", async ({
    githubApp,
    github: _,
  }) => {
    server.use(
      http.get(
        `${API}/repos/acme/web/installation`,
        () => new HttpResponse(null, { status: 503 }),
        { once: true },
      ),
    );
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus: 503,
    });
    expect((await tokens.getToken("acme/web")).token).toBe("ghs_1");
  });

  test.each([
    {
      description: "a rate limit",
      response: () =>
        new HttpResponse(null, { status: 403, headers: { "x-ratelimit-remaining": "0" } }),
      httpStatus: 403,
    },
    { description: "a network failure", response: () => HttpResponse.error(), httpStatus: null },
  ])("treats $description as retryable", async ({ response, httpStatus }) => {
    server.use(http.get(`${API}/repos/acme/web/installation`, response));
    const tokens = createInstallationTokenProvider({ config: generateAppConfig(), apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus,
    });
  });

  test("looks the installation up again when it no longer exists", async ({
    githubApp,
    github,
  }) => {
    server.use(
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 404 }),
        { once: true },
      ),
    );
    const tokens = createInstallationTokenProvider({ config: githubApp, apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({ httpStatus: 404 });
    expect((await tokens.getToken("acme/web")).token).toBe("ghs_1");
    expect(github.lookups).toBe(2);
  });
});
