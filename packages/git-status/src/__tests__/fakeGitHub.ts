import { createPrivateKey, createPublicKey, generateKeyPairSync, verify } from "node:crypto";

import { http, HttpResponse } from "msw";

import type { GitHubAppConfig } from "../githubApp/config";
import { server } from "./setup";

const API = "https://api.github.com";
const HOUR = 60 * 60 * 1000;

export const generateAppPrivateKey = (): string =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  }).privateKey;

export const generateAppConfig = (): GitHubAppConfig => ({
  appId: "1234",
  privateKey: createPrivateKey(generateAppPrivateKey()),
});

export const decodeJwt = (jwt: string, app: GitHubAppConfig) => {
  const [header = "", payload = "", signature = ""] = jwt.split(".");
  return {
    valid: verify(
      "sha256",
      Buffer.from(`${header}.${payload}`),
      createPublicKey(app.privateKey),
      Buffer.from(signature, "base64url"),
    ),
    header: JSON.parse(Buffer.from(header, "base64url").toString()),
    claims: JSON.parse(Buffer.from(payload, "base64url").toString()),
  };
};

export type FakeGitHub = {
  // The App is installed, as installation 42, on every repo this owner has.
  installedOn: string;
  permissions: Record<string, string>;
  rejectedTokens: Set<string>;
  lookups: number;
  mintedTokens: string[];
  statusTokens: string[];
};

const bearer = (request: Request) =>
  request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";

export const startFakeGitHub = (app: GitHubAppConfig): FakeGitHub => {
  const github: FakeGitHub = {
    installedOn: "acme",
    permissions: { statuses: "write", metadata: "read" },
    rejectedTokens: new Set(),
    lookups: 0,
    mintedTokens: [],
    statusTokens: [],
  };
  const signedByApp = (request: Request) => decodeJwt(bearer(request), app).valid;

  server.use(
    http.get(`${API}/repos/:owner/:repo/installation`, ({ request, params }) => {
      github.lookups += 1;
      if (!signedByApp(request)) {
        return new HttpResponse(null, { status: 401 });
      }
      if (params.owner !== github.installedOn) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json({ id: 42, permissions: github.permissions });
    }),
    http.post(`${API}/app/installations/42/access_tokens`, ({ request }) => {
      if (!signedByApp(request)) {
        return new HttpResponse(null, { status: 401 });
      }
      const token = `ghs_${github.mintedTokens.length + 1}`;
      github.mintedTokens.push(token);
      return HttpResponse.json(
        { token, expires_at: new Date(Date.now() + HOUR).toISOString() },
        { status: 201 },
      );
    }),
    http.post(`${API}/repos/:owner/:repo/statuses/:sha`, ({ request }) => {
      const token = bearer(request);
      github.statusTokens.push(token);
      return new HttpResponse(null, { status: github.rejectedTokens.has(token) ? 401 : 201 });
    }),
  );

  return github;
};
