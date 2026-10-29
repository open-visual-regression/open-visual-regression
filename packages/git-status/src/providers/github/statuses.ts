import type { HttpRequest, PublishRequest, VerifyRequest } from "../../publisher";
import type { GitProviderModule } from "../types";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

const headers = (token: string): Record<string, string> => ({
  authorization: `Bearer ${token}`,
  accept: "application/json",
  "x-github-api-version": GITHUB_API_VERSION,
});

const buildRequest = (
  repoIdentifier: string,
  token: string,
  request: PublishRequest,
): HttpRequest => ({
  url: `${GITHUB_API_URL}/repos/${repoIdentifier}/statuses/${request.sha}`,
  headers: headers(token),
  body: {
    state: request.state,
    context: request.context,
    description: request.description,
    target_url: request.targetUrl,
  },
});

const buildVerifyRequest = (repoIdentifier: string, token: string): VerifyRequest => ({
  url: `${GITHUB_API_URL}/repos/${repoIdentifier}`,
  headers: headers(token),
});

export const githubStatuses: GitProviderModule["statuses"] = { buildRequest, buildVerifyRequest };
