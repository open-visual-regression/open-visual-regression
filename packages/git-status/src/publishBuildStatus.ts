import { dbClient } from "@ovr/db/client";
import type { BuildProcessingStatus, BuildReviewStatus, GitProvider } from "@ovr/db/schema";
import { createLogger } from "@ovr/logger";
import { createCounter } from "@ovr/metrics";

import { resolveAdapter } from "./adapters";
import { resolveCredential, type Credential, type IntegrationCredentials } from "./credentials";
import {
  mapBuildStatus,
  send,
  type Adapter,
  type PublishOutcome,
  type PublishRequest,
} from "./publisher";

const logger = createLogger("git-status");

const publications = createCounter<{
  provider: GitProvider;
  state: PublishRequest["state"];
  outcome: PublishOutcome["outcome"];
}>("ovr.git.status.publications", {
  description: "Commit statuses sent to the git provider, by the state sent and the outcome.",
});

type BuildForPublish = {
  id: string;
  projectId: string;
  commitSha: string;
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
};

type IntegrationForPublish = IntegrationCredentials & {
  checkContext: string;
  statusChecksEnabled: boolean;
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
  resolveCredential: (integration: IntegrationCredentials) => Promise<Credential>;
  send: (request: Parameters<typeof send>[0]) => Promise<PublishOutcome>;
  baseUrl: string;
};

const defaultDeps = (): PublishBuildStatusDeps => ({
  findBuild: dbClient.builds.findById,
  findIntegration: dbClient.gitIntegrations.findByProject,
  recordPublication: dbClient.gitStatusPublications.record,
  resolveAdapter,
  resolveCredential,
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
  if (!integration?.statusChecksEnabled) {
    return;
  }

  const { state, description } = mapBuildStatus(build);
  const adapter = deps.resolveAdapter(integration.provider);
  const targetUrl = `${deps.baseUrl}/projects/${build.projectId}/builds/${build.id}`;

  const recordUnsent = async (error: string) => {
    await deps.recordPublication({
      buildId: build.id,
      commitSha: build.commitSha,
      context: integration.checkContext,
      state,
      outcome: "error",
      httpStatus: null,
      error,
    });
    publications.add(1, { provider: integration.provider, state, outcome: "error" });
    logger.error({ buildId: build.id, provider: integration.provider }, error);
  };

  const credential = await deps.resolveCredential(integration);
  if (!credential.ok) {
    await recordUnsent(credential.error);
    if (credential.retryable) {
      throw new GitStatusPublishError(credential.error);
    }
    return;
  }

  const buildRequest = (token: string) =>
    adapter.buildRequest(
      { provider: integration.provider, repoIdentifier: integration.repoIdentifier, token },
      { sha: build.commitSha, state, context: integration.checkContext, description, targetUrl },
    );

  let result = await deps.send(buildRequest(credential.token));

  // A cached GitHub App token can be revoked before it expires. Retry once with a fresh one.
  if (result.httpStatus === 401 && credential.renew) {
    const renewed = await credential.renew();
    if (renewed.ok) {
      result = await deps.send(buildRequest(renewed.token));
    }
  }

  await deps.recordPublication({
    buildId: build.id,
    commitSha: build.commitSha,
    context: integration.checkContext,
    state,
    outcome: result.outcome,
    httpStatus: result.httpStatus ?? null,
    error: result.error ?? null,
  });
  publications.add(1, { provider: integration.provider, state, outcome: result.outcome });

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
