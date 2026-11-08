import { toCaptureGroups } from "@ovr/builds/lib/captureGroups";
import { withBundleDir } from "@ovr/builds/storybookBundleCache";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetExternalRequestAllowlist,
  resolveTargetScreenshotStability,
  resolveTargetViewports,
  resolveTargetWaitForTimeout,
  toViewportName,
} from "@ovr/capture-browser/storyViewports";
import type { NamedViewport } from "@ovr/capture-browser/storyViewports";
import { dbClient } from "@ovr/db/client";
import { enqueueCaptureGroups, enqueueFinalize } from "@ovr/queue/producer";
import { findBuildComparisonBaselines, toBaselineKey } from "@ovr/reviews/baselines";
import {
  DEFAULT_SCREENSHOT_STABILITY,
  type ScreenshotStability,
} from "@ovr/storybook-compat/parameters";
import { assertSupportedStorybookBuild } from "@ovr/storybook-compat/version";

import { snapshotsCreated } from "./lib/metrics";
import { markSnapshotErrored } from "./snapshots";

type Target = { id: string; title: string; name: string };

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
  unaffectedTargetIds: string[] = [],
  waitForTimeout = 0,
  externalRequestAllowlist: string[] | null = null,
  screenshotStability: ScreenshotStability = DEFAULT_SCREENSHOT_STABILITY,
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
        {},
        externalRequestAllowlist,
      );
    },
  );

  const unaffected = new Set(unaffectedTargetIds);

  const values = targets.flatMap((target) => {
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

    return resolveTargetViewports(viewports, override?.viewports).map((viewport) => {
      const snapshot = {
        buildId,
        browser: viewport.browser,
        viewportWidth: viewport.viewportWidth,
        viewportHeight: viewport.viewportHeight ?? 0,
        viewportName: toViewportName(viewport),
        targetId: target.id,
        targetTitle: target.title,
        targetName: target.name,
        diffThreshold: resolveTargetDiffThreshold(diffThreshold, override),
        waitForTimeout: resolveTargetWaitForTimeout(waitForTimeout, override),
        screenshotStability: resolveTargetScreenshotStability(screenshotStability, override),
        externalRequestAllowlist: resolveTargetExternalRequestAllowlist(
          externalRequestAllowlist,
          override,
        ),
      };
      return { ...snapshot, status: "queued" as const };
    });
  });

  // An unaffected story keeps its baseline instead of being captured, if it has one.
  const baselines = await findBuildComparisonBaselines(
    build,
    values.filter((value) => value.status === "skipped" || unaffected.has(value.targetId)),
  );
  const created = await dbClient.snapshots.createMany({
    values: values.map((value) => {
      const baselineSnapshotId = baselines.get(toBaselineKey(value))?.snapshotId ?? null;

      if (value.status === "skipped") {
        return { ...value, baselineSnapshotId };
      }

      return unaffected.has(value.targetId) && baselineSnapshotId
        ? { ...value, status: "skipped" as const, baselineSnapshotId }
        : value;
    }),
  });
  const skipped = created.filter(({ status }) => status === "skipped").length;
  snapshotsCreated.add(created.length - skipped, { status: "queued" });
  snapshotsCreated.add(skipped, { status: "skipped" });

  await failUnreadableTargets(buildId, targets, viewports, diffThreshold, failures);

  const current = await dbClient.builds.findById(buildId);
  if (current?.processingStatus === "canceled") {
    await dbClient.snapshots.markUnfinishedAs(buildId, "canceled");
    return;
  }

  const snapshots = await dbClient.snapshots.findByBuild(buildId);

  if (snapshots.every((snapshot) => snapshot.status === "skipped")) {
    await enqueueFinalize({ buildId });
    return;
  }

  await enqueueCaptureGroups(
    buildId,
    toCaptureGroups(snapshots.filter((snapshot) => snapshot.status === "queued")),
  );
};
