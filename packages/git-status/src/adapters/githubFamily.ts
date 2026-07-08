import type {
  Adapter,
  AdapterConfig,
  HttpRequest,
  PublishRequest,
  VerifyRequest,
} from "../publisher";

const GITHUB_API_VERSION = "2022-11-28";

const headers = (token: string): Record<string, string> => ({
  authorization: `Bearer ${token}`,
  accept: "application/json",
  "x-github-api-version": GITHUB_API_VERSION,
});

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const resolveApiBase = ({ provider, baseUrl }: AdapterConfig): string => {
  const trimmed = baseUrl ? trimTrailingSlash(baseUrl) : null;

  switch (provider) {
    case "github":
      return "https://api.github.com";
    case "gitea":
      if (!trimmed) {
        throw new Error("gitea requires a base URL");
      }
      return `${trimmed}/api/v1`;
  }
};

const buildRequest = (config: AdapterConfig, request: PublishRequest): HttpRequest => ({
  url: `${resolveApiBase(config)}/repos/${config.repoIdentifier}/statuses/${request.sha}`,
  headers: headers(config.token),
  body: {
    state: request.state,
    context: request.context,
    description: request.description,
    target_url: request.targetUrl,
  },
});

const buildVerifyRequest = (config: AdapterConfig): VerifyRequest => ({
  url: `${resolveApiBase(config)}/repos/${config.repoIdentifier}`,
  headers: headers(config.token),
});

export const githubFamilyAdapter: Adapter = { buildRequest, buildVerifyRequest };
