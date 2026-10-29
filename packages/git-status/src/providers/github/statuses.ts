import type { HttpRequest, PublishRequest, VerifyRequest } from "../../publisher";
import type { GitProviderModule } from "../types";
import { githubApiUrl, githubHeaders } from "./api";

const buildRequest = (
  repoIdentifier: string,
  token: string,
  request: PublishRequest,
): HttpRequest => ({
  url: `${githubApiUrl()}/repos/${repoIdentifier}/statuses/${request.sha}`,
  headers: githubHeaders(token),
  body: {
    state: request.state,
    context: request.context,
    description: request.description,
    target_url: request.targetUrl,
  },
});

const buildVerifyRequest = (repoIdentifier: string, token: string): VerifyRequest => ({
  url: `${githubApiUrl()}/repos/${repoIdentifier}`,
  headers: githubHeaders(token),
});

export const githubStatuses: GitProviderModule["statuses"] = { buildRequest, buildVerifyRequest };
