const DEFAULT_REDIRECT_PATH = "/projects";

export const CALLBACK_URL_PARAM = "callback_url";

export const REQUEST_PATH_HEADER = "x-ovr-request-path";

export const FORBIDDEN_REASONS = ["no-role", "unverified", "not-set-up"] as const;

export type ForbiddenReason = (typeof FORBIDDEN_REASONS)[number];

export const getForbiddenPath = (reason: ForbiddenReason) =>
  `/forbidden?${new URLSearchParams({ reason })}`;

export const getLoginPath = (callbackUrl: string) =>
  `/login?${new URLSearchParams({ [CALLBACK_URL_PARAM]: callbackUrl })}`;

export const getSafeRedirectPath = (callbackUrl: unknown) => {
  if (
    typeof callbackUrl !== "string" ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//")
  ) {
    return DEFAULT_REDIRECT_PATH;
  }

  const base = "http://localhost";
  const url = new URL(callbackUrl, base);

  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_REDIRECT_PATH;
};
