import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";

import { http, HttpResponse } from "msw";

import { readGitHubAppConfig, type GitHubAppConfig } from "../githubApp/config";
import { server } from "./setup";

const API = "https://api.github.com";
const HOUR = 60 * 60 * 1000;

/** A fresh RSA private key, in the PKCS#1 PEM format GitHub issues App keys in. */
export const generateAppPrivateKey = (): string =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  }).privateKey;

export const generateAppConfig = (): GitHubAppConfig =>
  readGitHubAppConfig({
    OVR_GITHUB_APP_ID: "1234",
    OVR_GITHUB_APP_PRIVATE_KEY: generateAppPrivateKey(),
  })!;

export const decodeJwt = (jwt: string, app: GitHubAppConfig) => {
  const [header, payload, signature] = jwt.split(".");
  return {
    valid: verify(
      "sha256",
      Buffer.from(`${header}.${payload}`),
      createPublicKey(app.privateKey),
      Buffer.from(signature ?? "", "base64url"),
    ),
    header: JSON.parse(Buffer.from(header!, "base64url").toString()),
    claims: JSON.parse(Buffer.from(payload!, "base64url").toString()),
  };
};

type FakeGitHubOptions = {
  /** The App GitHub knows about. Requests signed with any other key are rejected. */
  app: GitHubAppConfig;
  /** The App is installed on every repo under this owner, as installation 42. */
  owner?: string;
  permissions?: Record<string, string>;
  now?: () => number;
  /** Installation tokens GitHub rejects when publishing a status, e.g. revoked ones. */
  rejectedTokens?: (token: string) => boolean;
};

export type FakeGitHub = {
  lookups: number;
  mintedTokens: string[];
  /** The token each status publish was sent with. */
  statusTokens: string[];
};

/** Serves the GitHub endpoints an App uses to look up installations, mint tokens and post statuses. */
export const useFakeGitHub = ({
  app,
  owner = "acme",
  permissions = { statuses: "write", metadata: "read" },
  now = Date.now,
  rejectedTokens = () => false,
}: FakeGitHubOptions): FakeGitHub => {
  const github: FakeGitHub = { lookups: 0, mintedTokens: [], statusTokens: [] };
  const signedByApp = (request: Request) =>
    decodeJwt(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "", app).valid;

  server.use(
    http.get(`${API}/repos/:owner/:repo/installation`, ({ request, params }) => {
      github.lookups += 1;
      if (!signedByApp(request)) {
        return new HttpResponse(null, { status: 401 });
      }
      if (params.owner !== owner) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json({ id: 42, permissions });
    }),
    http.post(`${API}/app/installations/42/access_tokens`, ({ request }) => {
      if (!signedByApp(request)) {
        return new HttpResponse(null, { status: 401 });
      }
      const token = `ghs_${github.mintedTokens.length + 1}`;
      github.mintedTokens.push(token);
      return HttpResponse.json(
        { token, expires_at: new Date(now() + HOUR).toISOString() },
        { status: 201 },
      );
    }),
    http.post(`${API}/repos/:owner/:repo/statuses/:sha`, ({ request }) => {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
      github.statusTokens.push(token);
      return new HttpResponse(null, { status: rejectedTokens(token) ? 401 : 201 });
    }),
  );

  return github;
};
