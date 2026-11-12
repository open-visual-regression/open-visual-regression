import {
  ACCESS_TOKEN_PERMISSIONS,
  type AccessTokenPermissions,
  type TokenPermissions,
} from "@ovr/api/contracts/accessTokens";

export const PERSONAL_TOKEN_PREFIX = "ovr_pat_";

export const API_KEY_PREFIX = "ovr_api_key_";

export const OVR_TOKEN_PREFIXES = [PERSONAL_TOKEN_PREFIX, API_KEY_PREFIX];

export const readBearerToken = (headers: Headers, prefixes: string[]): string | undefined => {
  const bearer = headers.get("authorization")?.replace("Bearer ", "");

  return bearer && prefixes.some((prefix) => bearer.startsWith(prefix)) ? bearer : undefined;
};

export const toTokenPermissions = (permissions: AccessTokenPermissions = {}): TokenPermissions => {
  const granted: TokenPermissions = { ...ACCESS_TOKEN_PERMISSIONS };

  for (const [resource, actions] of Object.entries(permissions)) {
    const merged = new Set([...(granted[resource] ?? []), ...(actions ?? [])]);

    if (merged.size > 0) {
      granted[resource] = [...merged];
    }
  }

  return granted;
};
