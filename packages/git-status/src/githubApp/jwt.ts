import { sign } from "node:crypto";

import type { GitHubAppConfig } from "./config";

// GitHub rejects an `iat` in its future, so backdate it to absorb clock skew between hosts.
const CLOCK_SKEW_SECONDS = 60;
// GitHub caps `exp` at 10 minutes after the time it receives the JWT.
const LIFETIME_SECONDS = 9 * 60;

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

/** Signs the RS256 JWT a GitHub App authenticates with to call the `/app` endpoints. */
export const signAppJwt = (config: GitHubAppConfig, nowMs: number = Date.now()): string => {
  const now = Math.floor(nowMs / 1000);
  const signingInput = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iat: now - CLOCK_SKEW_SECONDS,
    exp: now + LIFETIME_SECONDS,
    iss: config.appId,
  })}`;
  const signature = sign("sha256", Buffer.from(signingInput), config.privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
};
