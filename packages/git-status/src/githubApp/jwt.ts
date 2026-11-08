import { sign } from "node:crypto";

import type { GitHubAppConfig } from "./config";

// Backdated for clock skew, since GitHub rejects an `iat` in the future.
const CLOCK_SKEW_SECONDS = 60;
// GitHub rejects an `exp` more than 10 minutes out.
const LIFETIME_SECONDS = 9 * 60;

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

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
