import { sign } from "node:crypto";

import type { GithubAppConfig } from "./config";

// GitHub rejects app JWTs that expire more than 10 minutes out, and recommends backdating
// `iat` by a minute to absorb clock drift.
const CLOCK_DRIFT_SECONDS = 60;
const LIFETIME_SECONDS = 9 * 60;

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

/** Signs the short-lived RS256 JWT a GitHub App uses to authenticate as itself. */
export const createAppJwt = (config: GithubAppConfig, now: number = Date.now()): string => {
  const nowSeconds = Math.floor(now / 1000);
  const header = encode({ alg: "RS256", typ: "JWT" });
  const payload = encode({
    iat: nowSeconds - CLOCK_DRIFT_SECONDS,
    exp: nowSeconds + LIFETIME_SECONDS,
    iss: config.clientId,
  });
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), config.privateKey);

  return `${header}.${payload}.${signature.toString("base64url")}`;
};
