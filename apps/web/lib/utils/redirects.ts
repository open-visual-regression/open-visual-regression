const DEFAULT_REDIRECT_PATH = "/projects";

export const CALLBACK_URL_PARAM = "callback_url";

export const REQUEST_PATH_HEADER = "x-ovr-request-path";

const PUBLIC_PATHS = ["/login", "/setup", "/invitations"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

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
