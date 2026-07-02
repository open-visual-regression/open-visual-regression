import { z } from "zod";

import { dbClient } from "@ovr/db/client";
import { enqueueCaptureGroup } from "@ovr/queue/producer";

import { withExtractedBundle } from "./lib/artifact";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetViewports,
} from "./storyViewports";
import type { NamedViewport } from "./storyViewports";

type Target = { id: string; title: string; name: string };

// Max snapshots sharing one warm browser per capture-group job.
export const CAPTURE_GROUP_SIZE = z.coerce
  .number()
  .int()
  .positive()
  .catch(10)
  .parse(process.env.CAPTURE_GROUP_SIZE);

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

const groupSnapshotIdsByBrowser = (
  snapshots: { id: string; browser: string }[],
): Map<string, string[]> =>
  snapshots.reduce((groups, snapshot) => {
    groups.set(snapshot.browser, [...(groups.get(snapshot.browser) ?? []), snapshot.id]);
    return groups;
  }, new Map<string, string[]>());

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
  const groupedByBrowser = groupSnapshotIdsByBrowser(snapshots);

  await Promise.all(
    Array.from(groupedByBrowser.entries()).flatMap(([browser, snapshotIds]) =>
      chunk(snapshotIds, CAPTURE_GROUP_SIZE).map((group) =>
        enqueueCaptureGroup({ buildId, browser, snapshotIds: group }),
      ),
    ),
  );
};
