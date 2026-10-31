import { failBuild } from "@ovr/builds/builds";
import { extractBuild } from "@ovr/capture/extract";
import { dbClient } from "@ovr/db/client";
import type { ExtractJobPayload } from "@ovr/queue";

type ExtractJob = { data: ExtractJobPayload };

export const run = async (job: ExtractJob): Promise<void> => {
  const build = await dbClient.builds.findById(job.data.buildId);

  if (build?.processingStatus !== "queued" && build?.processingStatus !== "processing") {
    return;
  }

  await extractBuild(
    job.data.buildId,
    job.data.targets,
    job.data.viewports,
    job.data.diffThreshold,
    job.data.unaffectedTargetIds,
    job.data.waitForTimeout,
    job.data.externalRequestAllowlist ?? null,
    job.data.screenshotStability,
  );
};

export const failed = async (job: ExtractJob, error?: Error): Promise<void> => {
  await failBuild(job.data.buildId, error?.message, "extract_failed");
};
