import { dbClient } from "@ovr/db/client";
import { enqueueCapture } from "@ovr/queue/producer";

import { withExtractedBundle } from "./lib/artifact";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetViewports,
} from "./storyViewports";
import type { NamedViewport } from "./storyViewports";

type Target = { id: string; title: string; name: string };

export const extractBuild = async (
  buildId: string,
  targets: Target[],
  viewports: NamedViewport[],
  diffThreshold: number,
): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);

  if (!build) {
    throw new Error(`Build not found: ${buildId}`);
  }

  const overridesByTarget = await withExtractedBundle(build.artifactPath, (bundleDir) =>
    readStoryParameterOverrides(
      bundleDir,
      targets.map((target) => target.id),
    ),
  );

  await dbClient.snapshots.createMany({
    values: targets.flatMap((target) => {
      const override = overridesByTarget.get(target.id);

      if (override?.skip) {
        return [];
      }

      return resolveTargetViewports(viewports, override?.viewports).map((viewport) => ({
        buildId,
        browser: viewport.browser,
        viewportWidth: viewport.viewportWidth,
        viewportHeight: viewport.viewportHeight ?? 0,
        targetId: target.id,
        targetTitle: target.title,
        targetName: target.name,
        status: "queued" as const,
        diffThreshold: resolveTargetDiffThreshold(diffThreshold, override),
      }));
    }),
  });

  const snapshots = await dbClient.snapshots.findByBuild(buildId);
  await Promise.all(
    snapshots.map((snapshot) => enqueueCapture({ buildId, snapshotId: snapshot.id })),
  );
};
