import type {
  Adapter,
  AdapterConfig,
  GitStatusState,
  HttpRequest,
  PublishRequest,
  VerifyRequest,
} from "../publisher";

const STATE_MAP: Record<GitStatusState, string> = {
  pending: "pending",
  success: "success",
  failure: "failed",
  error: "failed",
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const resolveBase = (config: AdapterConfig): string =>
  config.baseUrl ? trimTrailingSlash(config.baseUrl) : "https://gitlab.com";

const headers = (token: string): Record<string, string> => ({
  "private-token": token,
  accept: "application/json",
});

const buildRequest = (config: AdapterConfig, request: PublishRequest): HttpRequest => {
  const project = encodeURIComponent(config.repoIdentifier);

  return {
    url: `${resolveBase(config)}/api/v4/projects/${project}/statuses/${request.sha}`,
    headers: headers(config.token),
    body: {
      state: STATE_MAP[request.state],
      name: request.context,
      description: request.description,
      target_url: request.targetUrl,
    },
  };
};

const buildVerifyRequest = (config: AdapterConfig): VerifyRequest => ({
  url: `${resolveBase(config)}/api/v4/projects/${encodeURIComponent(config.repoIdentifier)}`,
  headers: headers(config.token),
});

export const gitlabAdapter: Adapter = { buildRequest, buildVerifyRequest };
