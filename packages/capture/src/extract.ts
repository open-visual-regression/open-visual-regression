import { z } from "zod";

import { dbClient } from "@ovr/db/client";
import { enqueueCaptureGroup } from "@ovr/queue/producer";

import { withExtractedBundle } from "./lib/artifact";
import { markSnapshotErrored } from "./snapshots";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetViewports,
} from "./storyViewports";
import type { NamedViewport } from "./storyViewports";

type Target = { id: string; title: string; name: string };

// 0 means "auto/full-page height" — mirrors how apps/web displays it
// (apps/web/lib/router/snapshots.ts, SnapshotHeader.tsx).
const toViewportName = (viewport: {
  name?: string;
  viewportWidth: number;
  viewportHeight?: number;
}): string => viewport.name ?? `${viewport.viewportWidth}x${viewport.viewportHeight || "auto"}`;

// Max snapshots sharing one warm browser per capture-group job.
export const CAPTURE_GROUP_SIZE = z.coerce
  .number()
  .int()
  .positive()
  .catch(10)
  .parse(process.env.OVR_CAPTURE_GROUP_SIZE);

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

const failUnreadableTargets = async (
  buildId: string,
  targets: Target[],
  viewports: NamedViewport[],
  diffThreshold: number,
  failures: Map<string, string>,
): Promise<void> => {
  if (failures.size === 0) {
    return;
  }

  const [defaultViewport] = resolveTargetViewports(viewports, undefined);
  const viewport = defaultViewport ?? viewports[0];

  for (const target of targets) {
    const message = failures.get(target.id);
    if (message === undefined) {
      continue;
    }

    const resolvedViewportWidth = viewport?.viewportWidth ?? 1280;
    const resolvedViewportHeight = viewport?.viewportHeight ?? 0;

    const [snapshot] = await dbClient.snapshots.createMany({
      values: [
        {
          buildId,
          browser: viewport?.browser ?? "chromium",
          viewportWidth: resolvedViewportWidth,
          viewportHeight: resolvedViewportHeight,
          viewportName: toViewportName({
            name: viewport?.name,
            viewportWidth: resolvedViewportWidth,
            viewportHeight: resolvedViewportHeight,
          }),
          targetId: target.id,
          targetTitle: target.title,
          targetName: target.name,
          status: "queued" as const,
          diffThreshold,
        },
      ],
    });

    await markSnapshotErrored(
      snapshot!.id,
      new Error(`Could not read viewport overrides: ${message}`),
    );
  }
};

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

  const { overrides, failures } = await withExtractedBundle(build.artifactPath, (bundleDir) =>
    readStoryParameterOverrides(
      bundleDir,
      targets.map((target) => target.id),
    ),
  );

  await dbClient.snapshots.createMany({
    values: targets.flatMap((target) => {
      if (failures.has(target.id)) {
        return [];
      }

      const override = overrides.get(target.id);

      if (override?.skip) {
        return [];
      }

      return resolveTargetViewports(viewports, override?.viewports).map((viewport) => ({
        buildId,
        browser: viewport.browser,
        viewportWidth: viewport.viewportWidth,
        viewportHeight: viewport.viewportHeight ?? 0,
        viewportName: toViewportName(viewport),
        targetId: target.id,
        targetTitle: target.title,
        targetName: target.name,
        status: "queued" as const,
        diffThreshold: resolveTargetDiffThreshold(diffThreshold, override),
      }));
    }),
  });

  await failUnreadableTargets(buildId, targets, viewports, diffThreshold, failures);

  const snapshots = await dbClient.snapshots.findByBuild(buildId);
  const groupedByBrowser = groupSnapshotIdsByBrowser(
    snapshots.filter((snapshot) => snapshot.status === "queued"),
  );

  await Promise.all(
    Array.from(groupedByBrowser.entries()).flatMap(([browser, snapshotIds]) =>
      chunk(snapshotIds, CAPTURE_GROUP_SIZE).map((group) =>
        enqueueCaptureGroup({ buildId, browser, snapshotIds: group }),
      ),
    ),
  );
};
