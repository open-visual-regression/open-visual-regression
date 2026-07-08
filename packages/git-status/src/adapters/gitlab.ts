import type {
  Adapter,
  AdapterConfig,
  GitStatusState,
  HttpRequest,
  PublishRequest,
} from "../publisher";

const STATE_MAP: Record<GitStatusState, string> = {
  pending: "pending",
  success: "success",
  failure: "failed",
  error: "failed",
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const buildRequest = (config: AdapterConfig, request: PublishRequest): HttpRequest => {
  const base = config.baseUrl ? trimTrailingSlash(config.baseUrl) : "https://gitlab.com";
  const project = encodeURIComponent(config.repoIdentifier);

  return {
    url: `${base}/api/v4/projects/${project}/statuses/${request.sha}`,
    headers: {
      "private-token": config.token,
      accept: "application/json",
    },
    body: {
      state: STATE_MAP[request.state],
      name: request.context,
      description: request.description,
      target_url: request.targetUrl,
    },
  };
};

export const gitlabAdapter: Adapter = { buildRequest };
