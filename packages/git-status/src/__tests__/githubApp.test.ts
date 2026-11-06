import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { GitHubAppConfigError, readGitHubAppConfig } from "../githubApp/config";
import {
  createInstallationTokenProvider,
  GitHubAppError,
  type GitHubAppClientOptions,
} from "../githubApp/installationTokens";
import { signAppJwt } from "../githubApp/jwt";
import { server } from "./setup";

const API = "https://api.github.com";
const { privateKey: pem } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const config = readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY: pem })!;
const publicKey = createPublicKey(config.privateKey);

const decodeJwt = (jwt: string) => {
  const [header, payload, signature] = jwt.split(".");
  const valid = verify(
    "sha256",
    Buffer.from(`${header}.${payload}`),
    publicKey,
    Buffer.from(signature!, "base64url"),
  );
  return {
    valid,
    header: JSON.parse(Buffer.from(header!, "base64url").toString()),
    claims: JSON.parse(Buffer.from(payload!, "base64url").toString()),
  };
};

describe("readGitHubAppConfig", () => {
  it("returns null when no App is configured", () => {
    expect(readGitHubAppConfig({})).toBeNull();
  });

  it("accepts a key stored on one line with escaped newlines", () => {
    const escaped = pem.trim().replace(/\n/g, "\\n");
    const parsed = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY: escaped,
    });
    expect(parsed?.appId).toBe("1234");
    expect(parsed?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  it("throws when only one of the two variables is set", () => {
    expect(() => readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234" })).toThrow(GitHubAppConfigError);
    expect(() => readGitHubAppConfig({ OVR_GITHUB_APP_PRIVATE_KEY: pem })).toThrow(
      GitHubAppConfigError,
    );
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

describe("signAppJwt", () => {
  it("signs an RS256 JWT issued by the App, backdated and valid for under 10 minutes", () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const { valid, header, claims } = decodeJwt(signAppJwt(config, now));

    expect(valid).toBe(true);
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(claims).toEqual({ iat: now / 1000 - 60, exp: now / 1000 + 540, iss: "1234" });
  });
});

type FakeGitHub = {
  lookups: number;
  mints: number;
  mintedFor: number[];
};

const HOUR = 60 * 60 * 1000;

const fakeGitHub = (clock: { now: number }): FakeGitHub => {
  const calls: FakeGitHub = { lookups: 0, mints: 0, mintedFor: [] };
  server.use(
    http.get(`${API}/repos/:owner/:repo/installation`, ({ request, params }) => {
      calls.lookups += 1;
      const jwt = request.headers.get("authorization")!.replace(/^Bearer /, "");
      if (!decodeJwt(jwt).valid) {
        return new HttpResponse(null, { status: 401 });
      }
      if (params.owner !== "acme") {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json({ id: 42, permissions: { statuses: "write", metadata: "read" } });
    }),
    http.post(`${API}/app/installations/:id/access_tokens`, ({ params }) => {
      calls.mints += 1;
      calls.mintedFor.push(Number(params.id));
      return HttpResponse.json(
        {
          token: `ghs_${calls.mints}`,
          expires_at: new Date(clock.now + HOUR).toISOString(),
        },
        { status: 201 },
      );
    }),
  );
  return calls;
};

const makeProvider = (clock: { now: number }, overrides: Partial<GitHubAppClientOptions> = {}) =>
  createInstallationTokenProvider({ config, apiBase: API, now: () => clock.now, ...overrides });

describe("createInstallationTokenProvider", () => {
  it("looks up the repo's installation and mints a token for it", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);

    const { token } = await makeProvider(clock).getToken("acme/web");

    expect(token).toBe("ghs_1");
    expect(calls).toEqual({ lookups: 1, mints: 1, mintedFor: [42] });
  });

  it("reuses a cached token until it is close to expiring", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);

    await provider.getToken("acme/web");
    clock.now += 50 * 60 * 1000;
    expect((await provider.getToken("acme/web")).token).toBe("ghs_1");
    expect(calls.mints).toBe(1);

    // Under five minutes left: refresh.
    clock.now += 6 * 60 * 1000;
    expect((await provider.getToken("acme/web")).token).toBe("ghs_2");
    expect(calls.mints).toBe(2);
    expect(calls.lookups).toBe(1);
  });

  it("shares one token across repos on the same installation", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);

    await provider.getToken("acme/web");
    await provider.getToken("acme/api");

    expect(calls.mints).toBe(1);
  });

  it("mints once for concurrent callers", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);

    const tokens = await Promise.all([
      provider.getToken("acme/web"),
      provider.getToken("acme/web"),
      provider.getToken("acme/web"),
    ]);

    expect(new Set(tokens.map((t) => t.token))).toEqual(new Set(["ghs_1"]));
    expect(calls).toMatchObject({ lookups: 1, mints: 1 });
  });

  it("mints once for concurrent callers refreshing an expiring token", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);

    await provider.getToken("acme/web");
    clock.now += 56 * 60 * 1000;
    const tokens = await Promise.all([
      provider.getToken("acme/web"),
      provider.getToken("acme/web"),
    ]);

    expect(tokens.map((t) => t.token)).toEqual(["ghs_2", "ghs_2"]);
    expect(calls.mints).toBe(2);
  });

  it("mints a new token after the current one is invalidated", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);

    const first = await provider.getToken("acme/web");
    first.invalidate();

    expect((await provider.getToken("acme/web")).token).toBe("ghs_2");
    expect(calls.mints).toBe(2);
  });

  it("fails terminally when the App is not installed on the repo", async () => {
    const clock = { now: Date.now() };
    fakeGitHub(clock);

    const error = await makeProvider(clock)
      .getToken("someone-else/web")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GitHubAppError);
    expect(error).toMatchObject({
      retryable: false,
      httpStatus: 404,
      message: "the GitHub App is not installed on someone-else/web",
    });
  });

  it("fails terminally when GitHub rejects the App's JWT", async () => {
    const clock = { now: Date.now() };
    fakeGitHub(clock);
    const { privateKey: otherPem } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const wrongKey = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY: otherPem,
    })!;

    await expect(
      makeProvider(clock, { config: wrongKey }).getToken("acme/web"),
    ).rejects.toMatchObject({
      retryable: false,
      httpStatus: 401,
      message: expect.stringMatching(/OVR_GITHUB_APP_ID/),
    });
  });

  it("treats a GitHub outage as retryable and does not cache the failure", async () => {
    const clock = { now: Date.now() };
    const provider = makeProvider(clock);
    server.use(
      http.get(
        `${API}/repos/:owner/:repo/installation`,
        () => new HttpResponse(null, { status: 503 }),
        {
          once: true,
        },
      ),
    );

    await expect(provider.getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus: 503,
    });

    fakeGitHub(clock);
    expect((await provider.getToken("acme/web")).token).toBe("ghs_1");
  });

  it("treats a rate limit as retryable", async () => {
    const clock = { now: Date.now() };
    server.use(
      http.get(
        `${API}/repos/:owner/:repo/installation`,
        () => new HttpResponse(null, { status: 403, headers: { "x-ratelimit-remaining": "0" } }),
      ),
    );

    await expect(makeProvider(clock).getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus: 403,
    });
  });

  it("treats a network failure as retryable", async () => {
    const clock = { now: Date.now() };
    server.use(http.get(`${API}/repos/:owner/:repo/installation`, () => HttpResponse.error()));

    await expect(makeProvider(clock).getToken("acme/web")).rejects.toMatchObject({
      retryable: true,
      httpStatus: null,
    });
  });

  it("looks the installation up again when it no longer exists", async () => {
    const clock = { now: Date.now() };
    const calls = fakeGitHub(clock);
    const provider = makeProvider(clock);
    server.use(
      http.post(
        `${API}/app/installations/:id/access_tokens`,
        () => new HttpResponse(null, { status: 404 }),
        { once: true },
      ),
    );

    await expect(provider.getToken("acme/web")).rejects.toMatchObject({
      retryable: false,
      httpStatus: 404,
    });
    expect((await provider.getToken("acme/web")).token).toBe("ghs_1");
    expect(calls.lookups).toBe(2);
  });
});
