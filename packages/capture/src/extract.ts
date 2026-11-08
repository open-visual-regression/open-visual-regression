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
import {
  findComparisonBase,
  findComparisonBaselines,
  toComparisonKey,
} from "@ovr/reviews/baselines";
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

const findBaselineKeys = async (projectId: string, unaffected: Set<string>) =>
  unaffected.size === 0
    ? new Set<string>()
    : new Set((await dbClient.baselines.findByProject(projectId)).map(toComparisonKey));

type ExtractedSnapshot = {
  status: "queued" | "skipped";
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

// A skipped snapshot keeps its baseline instead of being captured, so it records that baseline
// the way a captured one records what it was compared against.
const withKeptBaselines = async <T extends ExtractedSnapshot>(
  build: { id: string; projectId: string; branch: string; baseBuildId: string | null },
  snapshots: T[],
): Promise<(T & { baselineSnapshotId?: string | null })[]> => {
  const skipped = snapshots.filter((snapshot) => snapshot.status === "skipped");

  if (skipped.length === 0) {
    return snapshots;
  }

  const project = await dbClient.projects.findById(build.projectId);
  if (!project) {
    throw new Error(`Project not found for build: ${build.id}`);
  }

  const base = await findComparisonBase(build, project);
  const baselines = await findComparisonBaselines(build.projectId, skipped, base);

  return snapshots.map((snapshot) =>
    snapshot.status === "skipped"
      ? {
          ...snapshot,
          baselineSnapshotId: baselines.get(toComparisonKey(snapshot))?.snapshotId ?? null,
        }
      : snapshot,
  );
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
  const baselineKeys = await findBaselineKeys(build.projectId, unaffected);

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
      const keepsBaseline =
        unaffected.has(target.id) && baselineKeys.has(toComparisonKey(snapshot));

      return { ...snapshot, status: keepsBaseline ? ("skipped" as const) : ("queued" as const) };
    });
  });
  const created = await dbClient.snapshots.createMany({
    values: await withKeptBaselines(build, values),
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
