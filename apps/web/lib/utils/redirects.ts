const DEFAULT_REDIRECT_PATH = "/projects";

export const getLoginPath = (next: string) => `/login?next=${encodeURIComponent(next)}`;

export const getSafeRedirectPath = (next: unknown) => {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  const base = "http://localhost";
  const url = new URL(next, base);

  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_REDIRECT_PATH;
};
