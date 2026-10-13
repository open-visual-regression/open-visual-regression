import {
  createRemoteJWKSet,
  importSPKI,
  jwtVerify,
  type JWTHeaderParameters,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

import type { TrustedProxyConfig } from "./config";
import { ROLES, type Role } from "./roles";
import { OVR_TOKEN_PREFIXES } from "./tokens";

export type ProxyIdentity = {
  issuer: string;
  subject: string;
  email: string;
  name: string;
  groups: string[];
};

export type ProxyIdentityResult =
  | [error: InvalidProxyTokenError, identity: null]
  | [error: null, identity: ProxyIdentity | null];

export class InvalidProxyTokenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidProxyTokenError";
  }
}

const remoteKeySets = new Map<string, JWTVerifyGetKey>();

const keyUrlKeys = new Map<string, Promise<CryptoKey>>();

const KEY_ID_PLACEHOLDER = "{kid}";

const fetchKeyUrlKey = async (url: string, algorithm: string): Promise<CryptoKey> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new InvalidProxyTokenError(`key lookup failed with status ${response.status}`);
  }

  return importSPKI(await response.text(), algorithm);
};

const getKeyUrlKey =
  (template: string): JWTVerifyGetKey =>
  ({ kid, alg }: JWTHeaderParameters) => {
    if (!kid) {
      throw new InvalidProxyTokenError("token has no key ID");
    }

    const url = template.replace(KEY_ID_PLACEHOLDER, encodeURIComponent(kid));
    const cached = keyUrlKeys.get(url);

    if (cached) {
      return cached;
    }

    const key = fetchKeyUrlKey(url, alg);
    keyUrlKeys.set(url, key);
    key.catch(() => keyUrlKeys.delete(url));

    return key;
  };

const getRemoteKeySet = (url: string): JWTVerifyGetKey => {
  const cached = remoteKeySets.get(url);

  if (cached) {
    return cached;
  }

  const keySet = createRemoteJWKSet(new URL(url));
  remoteKeySets.set(url, keySet);

  return keySet;
};

const getKey = (config: TrustedProxyConfig): JWTVerifyGetKey => {
  const getConfiguredKey = config.jwksUrl
    ? getRemoteKeySet(config.jwksUrl)
    : getKeyUrlKey(config.keyUrl!);

  return (header, token) => {
    if (config.signer && header.signer !== config.signer) {
      throw new InvalidProxyTokenError("token was not signed by the expected signer");
    }

    return getConfiguredKey(header, token);
  };
};

const readToken = (headers: Headers, tokenHeader: string): string | null => {
  const token = headers
    .get(tokenHeader)
    ?.trim()
    .replace(/^Bearer\s+/i, "");

  return token && !OVR_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix)) ? token : null;
};

const readGroups = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  return Array.isArray(value)
    ? value.filter((group): group is string => typeof group === "string")
    : [];
};

const toIdentity = (payload: JWTPayload, config: TrustedProxyConfig): ProxyIdentity => {
  const email = payload[config.emailClaim];
  const name = payload[config.nameClaim];

  if (!payload.sub) {
    throw new InvalidProxyTokenError("token has no subject");
  }

  if (typeof email !== "string" || !email) {
    throw new InvalidProxyTokenError(`token has no ${config.emailClaim} claim`);
  }

  return {
    issuer: config.issuer,
    subject: payload.sub,
    email: email.toLowerCase(),
    name: typeof name === "string" && name ? name : email,
    groups: readGroups(payload[config.groupsClaim]),
  };
};

export const verifyProxyToken = async (
  headers: Headers,
  config: TrustedProxyConfig,
): Promise<ProxyIdentityResult> => {
  const token = readToken(headers, config.tokenHeader);

  if (!token) {
    return [null, null];
  }

  try {
    const { payload } = await jwtVerify(token, getKey(config), {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: config.algorithms,
    });

    return [null, toIdentity(payload, config)];
  } catch (error) {
    return [
      error instanceof InvalidProxyTokenError
        ? error
        : new InvalidProxyTokenError(error instanceof Error ? error.message : "invalid token", {
            cause: error,
          }),
      null,
    ];
  }
};

export const resolveRole = (
  groups: string[],
  roleGroups: TrustedProxyConfig["roleGroups"],
): Role | null =>
  ROLES.find((role) => roleGroups[role]?.some((group) => groups.includes(group))) ?? null;
