import { toCaptureGroups } from "@ovr/builds/lib/captureGroups";
import { withBundleDir } from "@ovr/builds/storybookBundleCache";
import {
  deserializeAllowlist,
  serializeAllowlist,
  type ExternalRequestAllowlist,
} from "@ovr/capture-browser/allowedHosts";
import {
  readStoryParameterOverrides,
  resolveTargetDiffThreshold,
  resolveTargetExternalRequestAllowlist,
  resolveTargetViewports,
  resolveTargetWaitForTimeout,
  toViewportName,
} from "@ovr/capture-browser/storyViewports";
import type { NamedViewport } from "@ovr/capture-browser/storyViewports";
import { dbClient } from "@ovr/db/client";
import { enqueueCaptureGroups, enqueueFinalize } from "@ovr/queue/producer";
import { assertSupportedStorybookBuild } from "@ovr/storybook-compat/version";

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

const baselineKey = (snapshot: {
  targetId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
}): string =>
  [snapshot.targetId, snapshot.browser, snapshot.viewportWidth, snapshot.viewportHeight].join(":");

const findBaselineKeys = async (projectId: string, unaffected: Set<string>) =>
  unaffected.size === 0
    ? new Set<string>()
    : new Set((await dbClient.baselines.findByProject(projectId)).map(baselineKey));

export const extractBuild = async (
  buildId: string,
  targets: Target[],
  viewports: NamedViewport[],
  diffThreshold: number,
  unaffectedTargetIds: string[] = [],
  waitForTimeout = 0,
  externalRequestAllowlist: string[] | null = null,
): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);

  if (!build) {
    throw new Error(`Build not found: ${buildId}`);
  }

  let allowlist: ExternalRequestAllowlist;
  try {
    allowlist = deserializeAllowlist(externalRequestAllowlist);
  } catch (error) {
    throw new Error(
      `ovr.config blockExternalRequests: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
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
        allowlist,
      );
    },
  );

  // A story whose override can't be read fails like one that can't load, rather than falling
  // back to the build's setting.
  const targetAllowlists = new Map<string, string[] | null>();
  for (const target of targets) {
    try {
      targetAllowlists.set(
        target.id,
        serializeAllowlist(
          resolveTargetExternalRequestAllowlist(allowlist, overrides.get(target.id)),
        ),
      );
    } catch (error) {
      failures.set(target.id, error instanceof Error ? error.message : String(error));
    }
  }

  const unaffected = new Set(unaffectedTargetIds);
  const baselineKeys = await findBaselineKeys(build.projectId, unaffected);

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
          externalRequestAllowlist: targetAllowlists.get(target.id) ?? null,
        };
        const keepsBaseline = unaffected.has(target.id) && baselineKeys.has(baselineKey(snapshot));

        return { ...snapshot, status: keepsBaseline ? ("skipped" as const) : ("queued" as const) };
      });
    }),
  });

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
