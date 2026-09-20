import type { OvrClient } from "../../client";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

export class BuildNeedsReviewError extends Error {
  constructor(public readonly reviewUrl: string) {
    super(`Build needs review: ${reviewUrl}`);
    this.name = "BuildNeedsReviewError";
  }
}

export class BuildFailedError extends Error {
  constructor(detail?: string) {
    super(detail ? `Build finished with an error: ${detail}` : "Build finished with an error");
    this.name = "BuildFailedError";
  }
}

export class BuildRejectedError extends Error {
  constructor() {
    super("Build was rejected");
    this.name = "BuildRejectedError";
  }
}

export class BuildCanceledError extends Error {
  constructor() {
    super("Build was canceled");
    this.name = "BuildCanceledError";
  }
}

export class BuildTimeoutError extends Error {
  constructor(timeoutSeconds: number) {
    super(`Timed out after ${timeoutSeconds}s waiting for build result`);
    this.name = "BuildTimeoutError";
  }
}

export type PollBuildStatusOptions = {
  client: { builds: Pick<OvrClient["builds"], "getBuildStatus"> };
  buildId: string;
  timeoutSeconds: number;
  pollIntervalMs?: number;
  onPoll?: (status: string) => void;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const pollBuildStatus = async ({
  client,
  buildId,
  timeoutSeconds,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  onPoll,
}: PollBuildStatusOptions): Promise<void> => {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (true) {
    const { status, reviewUrl, errorMessage } = await client.builds.getBuildStatus({ buildId });

    onPoll?.(status);

    if (status === "unchanged" || status === "auto_approved" || status === "approved") {
      return;
    }

    if (status === "needs_review") {
      throw new BuildNeedsReviewError(reviewUrl ?? "");
    }

    if (status === "rejected") {
      throw new BuildRejectedError();
    }

    if (status === "canceled") {
      throw new BuildCanceledError();
    }

    if (status === "error") {
      throw new BuildFailedError(errorMessage);
    }

    if (Date.now() >= deadline) {
      throw new BuildTimeoutError(timeoutSeconds);
    }

    await sleep(pollIntervalMs);
  }
};
