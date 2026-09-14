import { z } from "zod";

import { withBundleDir } from "@ovr/builds/storybookBundleCache";
import { dbClient } from "@ovr/db/client";
import { enqueueCaptureGroup, enqueueFinalize } from "@ovr/queue/producer";
import { assertSupportedStorybookBuild } from "@ovr/storybook-compat/version";

import { markSnapshotErrored } from "./snapshots";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetViewports,
} from "./storyViewports";
import type { NamedViewport } from "./storyViewports";

type Target = { id: string; title: string; name: string };

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

const resolveDefaultViewport = (viewports: NamedViewport[]): NamedViewport | undefined => {
  const [defaultViewport] = resolveTargetViewports(viewports, undefined);
  return defaultViewport ?? viewports[0];
};

const toUncapturedSnapshot = (
  buildId: string,
  target: Target,
  viewport: NamedViewport | undefined,
  diffThreshold: number,
  status: "queued" | "skipped",
) => {
  const viewportWidth = viewport?.viewportWidth ?? 1280;
  const viewportHeight = viewport?.viewportHeight ?? 0;

  return {
    buildId,
    browser: viewport?.browser ?? "chromium",
    viewportWidth,
    viewportHeight,
    viewportName: toViewportName({ name: viewport?.name, viewportWidth, viewportHeight }),
    targetId: target.id,
    targetTitle: target.title,
    targetName: target.name,
    status,
    diffThreshold,
  };
};

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

  const viewport = resolveDefaultViewport(viewports);

  for (const target of targets) {
    const message = failures.get(target.id);
    if (message === undefined) {
      continue;
    }

    const [snapshot] = await dbClient.snapshots.createMany({
      values: [toUncapturedSnapshot(buildId, target, viewport, diffThreshold, "queued")],
    });

    await markSnapshotErrored(snapshot!.id, new Error(`Story failed to load: ${message}`));
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

  const { overrides, failures } = await withBundleDir(
    buildId,
    build.artifactPath,
    async (bundleDir) => {
      await assertSupportedStorybookBuild(bundleDir);

      return readStoryParameterOverrides(
        bundleDir,
        targets.map((target) => target.id),
      );
    },
  );

  await dbClient.snapshots.createMany({
    values: targets.flatMap((target) => {
      if (failures.has(target.id)) {
        return [];
      }

      const override = overrides.get(target.id);

      if (override?.skip) {
        return [
          toUncapturedSnapshot(
            buildId,
            target,
            resolveDefaultViewport(viewports),
            diffThreshold,
            "skipped",
          ),
        ];
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

  if (snapshots.every((snapshot) => snapshot.status === "skipped")) {
    await enqueueFinalize({ buildId });
    return;
  }

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
