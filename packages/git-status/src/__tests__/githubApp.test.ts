import { generateKeyPairSync } from "node:crypto";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { GitHubAppConfigError, readGitHubAppConfig } from "../githubApp/config";
import { createInstallationTokenProvider } from "../githubApp/installationTokens";
import { signAppJwt } from "../githubApp/jwt";
import { decodeJwt, generateAppConfig, generateAppPrivateKey, useFakeGitHub } from "./fakeGitHub";
import { server } from "./setup";

const API = "https://api.github.com";

describe("readGitHubAppConfig", () => {
  it("returns null when no App is configured", () => {
    expect(readGitHubAppConfig({})).toBeNull();
  });

  it("accepts a key stored on one line with escaped newlines", () => {
    const escaped = generateAppPrivateKey().trim().replace(/\n/g, "\\n");

    const config = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY: escaped,
    });

    expect(config?.appId).toBe("1234");
    expect(config?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  it.each([
    { OVR_GITHUB_APP_ID: "1234" },
    { OVR_GITHUB_APP_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----" },
  ])("throws when only one variable is set: %o", (env) => {
    expect(() => readGitHubAppConfig(env)).toThrow(GitHubAppConfigError);
  });

  it("throws on a key that is not a PEM private key", () => {
    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY: "nope" }),
    ).toThrow(/not a valid PEM private key/);
  });

  it("throws on a key that is not RSA", () => {
    const { privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });

    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY: privateKey }),
    ).toThrow(/RSA/);
  });
});

it("signs an RS256 App JWT, backdated and valid for under 10 minutes", () => {
  const app = generateAppConfig();
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  const { valid, header, claims } = decodeJwt(signAppJwt(app, now), app);

  expect(valid).toBe(true);
  expect(header).toEqual({ alg: "RS256", typ: "JWT" });
  expect(claims).toEqual({ iat: now / 1000 - 60, exp: now / 1000 + 540, iss: "1234" });
});

describe("installation tokens", () => {
  it("mints a token for the repo's installation", async () => {
    const app = generateAppConfig();
    const github = useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });

    const { token } = await tokens.getToken("acme/web");

    expect(token).toBe("ghs_1");
    expect(github.lookups).toBe(1);
  });

  it("reuses a cached token until it has five minutes left", async () => {
    const app = generateAppConfig();
    const clock = { now: Date.now() };
    const github = useFakeGitHub({ app, now: () => clock.now });
    const tokens = createInstallationTokenProvider({
      config: app,
      apiBase: API,
      now: () => clock.now,
    });

    await tokens.getToken("acme/web");
    clock.now += 50 * 60 * 1000;
    const cached = await tokens.getToken("acme/web");
    clock.now += 6 * 60 * 1000;
    const refreshed = await tokens.getToken("acme/web");

    expect([cached.token, refreshed.token]).toEqual(["ghs_1", "ghs_2"]);
    expect(github.lookups).toBe(1);
  });

  it("shares one token across repos on the same installation", async () => {
    const app = generateAppConfig();
    const github = useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });

    await tokens.getToken("acme/web");
    await tokens.getToken("acme/api");

    expect(github.mintedTokens).toEqual(["ghs_1"]);
  });

  it("mints once for concurrent callers", async () => {
    const app = generateAppConfig();
    const github = useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });

    const results = await Promise.all([
      tokens.getToken("acme/web"),
      tokens.getToken("acme/web"),
      tokens.getToken("acme/web"),
    ]);

    expect(results.map((result) => result.token)).toEqual(["ghs_1", "ghs_1", "ghs_1"]);
    expect(github.lookups).toBe(1);
  });

  it("mints once for concurrent callers refreshing an expiring token", async () => {
    const app = generateAppConfig();
    const clock = { now: Date.now() };
    const github = useFakeGitHub({ app, now: () => clock.now });
    const tokens = createInstallationTokenProvider({
      config: app,
      apiBase: API,
      now: () => clock.now,
    });

    await tokens.getToken("acme/web");
    clock.now += 56 * 60 * 1000;
    const results = await Promise.all([tokens.getToken("acme/web"), tokens.getToken("acme/web")]);

    expect(results.map((result) => result.token)).toEqual(["ghs_2", "ghs_2"]);
    expect(github.mintedTokens).toEqual(["ghs_1", "ghs_2"]);
  });

  it("mints a new token after the current one is invalidated", async () => {
    const app = generateAppConfig();
    useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });

    const first = await tokens.getToken("acme/web");
    first.invalidate();
    const second = await tokens.getToken("acme/web");

    expect(second.token).toBe("ghs_2");
  });

  it("fails terminally when the App is not installed on the repo", async () => {
    const app = generateAppConfig();
    useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });

    await expect(tokens.getToken("someone-else/web")).rejects.toMatchObject({
      retryable: false,
      httpStatus: 404,
      message: "the GitHub App is not installed on someone-else/web",
    });
  });

  it("fails terminally when GitHub rejects the App's key", async () => {
    useFakeGitHub({ app: generateAppConfig() });
    const tokens = createInstallationTokenProvider({ config: generateAppConfig(), apiBase: API });

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: false,
      httpStatus: 401,
      message: expect.stringMatching(/OVR_GITHUB_APP_ID/),
    });
  });

  it("retries a failed lookup instead of caching the failure", async () => {
    const app = generateAppConfig();
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });
    server.use(
      http.get(
        `${API}/repos/acme/web/installation`,
        () => new HttpResponse(null, { status: 503 }),
        { once: true },
      ),
    );

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus: 503,
    });

    useFakeGitHub({ app });
    expect((await tokens.getToken("acme/web")).token).toBe("ghs_1");
  });

  it.each([
    { description: "a rate limit", response: () => rateLimited(), httpStatus: 403 },
    { description: "a network failure", response: () => HttpResponse.error(), httpStatus: null },
  ])("treats $description as retryable", async ({ response, httpStatus }) => {
    const tokens = createInstallationTokenProvider({ config: generateAppConfig(), apiBase: API });
    server.use(http.get(`${API}/repos/acme/web/installation`, response));

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus,
    });
  });

  it("looks the installation up again when it no longer exists", async () => {
    const app = generateAppConfig();
    const github = useFakeGitHub({ app });
    const tokens = createInstallationTokenProvider({ config: app, apiBase: API });
    server.use(
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 404 }),
        { once: true },
      ),
    );

    await expect(tokens.getToken("acme/web")).rejects.toMatchObject({ httpStatus: 404 });
    expect((await tokens.getToken("acme/web")).token).toBe("ghs_1");
    expect(github.lookups).toBe(2);
  });
});

const rateLimited = () =>
  new HttpResponse(null, { status: 403, headers: { "x-ratelimit-remaining": "0" } });
