const API_URL_ENV_VAR = "OVR_GITHUB_API_URL";
const DEFAULT_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

/** The GitHub REST API root. Overridable so tests (and later GitHub Enterprise Server) can point elsewhere. */
export const githubApiUrl = (): string =>
  (process.env[API_URL_ENV_VAR]?.trim() || DEFAULT_API_URL).replace(/\/+$/, "");

export const githubHeaders = (token: string): Record<string, string> => ({
  authorization: `Bearer ${token}`,
  accept: "application/json",
  "x-github-api-version": GITHUB_API_VERSION,
});
