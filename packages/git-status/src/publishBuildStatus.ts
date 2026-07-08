import { dbClient } from "@ovr/db/client";
import type { BuildProcessingStatus, BuildReviewStatus, GitProvider } from "@ovr/db/schema";
import { createLogger } from "@ovr/logger";

import { resolveAdapter } from "./adapters";
import { decryptToken } from "./crypto";
import {
  mapBuildStatus,
  send,
  type Adapter,
  type PublishOutcome,
  type PublishRequest,
} from "./publisher";

const logger = createLogger("git-status");

type BuildForPublish = {
  id: string;
  projectId: string;
  commitSha: string;
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
};

type IntegrationForPublish = {
  provider: GitProvider;
  baseUrl: string | null;
  repoIdentifier: string;
  encryptedToken: string;
  checkContext: string;
};

type PublicationRecord = {
  buildId: string;
  commitSha: string;
  context: string;
  state: PublishRequest["state"];
  outcome: PublishOutcome["outcome"];
  httpStatus: number | null;
  error: string | null;
};

export type PublishBuildStatusDeps = {
  findBuild: (buildId: string) => Promise<BuildForPublish | undefined>;
  findIntegration: (projectId: string) => Promise<IntegrationForPublish | undefined>;
  recordPublication: (values: PublicationRecord) => Promise<unknown>;
  resolveAdapter: (provider: GitProvider) => Adapter;
  decryptToken: (payload: string) => string;
  send: (request: Parameters<typeof send>[0]) => Promise<PublishOutcome>;
  baseUrl: string;
};

const defaultDeps = (): PublishBuildStatusDeps => ({
  findBuild: dbClient.builds.findById,
  findIntegration: dbClient.gitIntegrations.findByProject,
  recordPublication: dbClient.gitStatusPublications.record,
  resolveAdapter,
  decryptToken,
  send,
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
});

export class GitStatusPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitStatusPublishError";
  }
}

export const publishBuildStatus = async (
  buildId: string,
  deps: PublishBuildStatusDeps = defaultDeps(),
): Promise<void> => {
  const build = await deps.findBuild(buildId);
  if (!build) {
    return;
  }

  const integration = await deps.findIntegration(build.projectId);
  if (!integration) {
    return;
  }

  const { state, description } = mapBuildStatus(build);
  const adapter = deps.resolveAdapter(integration.provider);
  const targetUrl = `${deps.baseUrl}/projects/${build.projectId}/builds/${build.id}`;

  const request = adapter.buildRequest(
    {
      provider: integration.provider,
      baseUrl: integration.baseUrl,
      repoIdentifier: integration.repoIdentifier,
      token: deps.decryptToken(integration.encryptedToken),
    },
    { sha: build.commitSha, state, context: integration.checkContext, description, targetUrl },
  );

  const result = await deps.send(request);

  await deps.recordPublication({
    buildId: build.id,
    commitSha: build.commitSha,
    context: integration.checkContext,
    state,
    outcome: result.outcome,
    httpStatus: result.httpStatus ?? null,
    error: result.error ?? null,
  });

  if (result.outcome === "error") {
    logger.error(
      {
        buildId: build.id,
        provider: integration.provider,
        state,
        httpStatus: result.httpStatus,
        retryable: result.retryable,
      },
      "failed to publish commit status",
    );

    if (result.retryable) {
      throw new GitStatusPublishError(result.error ?? "failed to publish commit status");
    }

    return;
  }

  logger.info(
    { buildId: build.id, provider: integration.provider, state, httpStatus: result.httpStatus },
    "published commit status",
  );
};
