import { githubApiUrl, githubHeaders } from "../githubApi";
import type {
  Adapter,
  AdapterConfig,
  HttpRequest,
  PublishRequest,
  VerifyRequest,
} from "../publisher";

const resolveApiBase = ({ provider }: AdapterConfig): string => {
  switch (provider) {
    case "github":
      return githubApiUrl();
  }
};

const buildRequest = (config: AdapterConfig, request: PublishRequest): HttpRequest => ({
  url: `${resolveApiBase(config)}/repos/${config.repoIdentifier}/statuses/${request.sha}`,
  headers: githubHeaders(config.token),
  body: {
    state: request.state,
    context: request.context,
    description: request.description,
    target_url: request.targetUrl,
  },
});

const buildVerifyRequest = (config: AdapterConfig): VerifyRequest => ({
  url: `${resolveApiBase(config)}/repos/${config.repoIdentifier}`,
  headers: githubHeaders(config.token),
});

export const githubFamilyAdapter: Adapter = { buildRequest, buildVerifyRequest };
