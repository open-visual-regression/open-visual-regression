import { toCaptureGroups } from "@ovr/builds/lib/captureGroups";
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

  const groups = toCaptureGroups(snapshots.filter((snapshot) => snapshot.status === "queued"));

  await Promise.all(groups.map((group) => enqueueCaptureGroup({ buildId, ...group })));
};
