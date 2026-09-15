export const PERSONAL_TOKEN_PREFIX = "ovr_pat_";

export const API_KEY_PREFIX = "ovr_api_key_";

export const OVR_TOKEN_PREFIXES = [PERSONAL_TOKEN_PREFIX, API_KEY_PREFIX];

export const readBearerToken = (headers: Headers, prefixes: string[]): string | undefined => {
  const bearer = headers.get("authorization")?.replace("Bearer ", "");

  return bearer && prefixes.some((prefix) => bearer.startsWith(prefix)) ? bearer : undefined;
};
