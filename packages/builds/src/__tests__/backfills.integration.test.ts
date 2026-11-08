import { dbClient } from "@ovr/db/client";

import { backfillSnapshotBaselines } from "../backfills";
import { describe, expect, test, type Viewport } from "./fixtures";

const seedComparedSnapshot = async (buildId: string, viewport: Viewport, targetId: string) => {
  const [baseline] = await dbClient.snapshots.createMany({
    values: [{ buildId, ...viewport, targetId }],
  });
  const [snapshot] = await dbClient.snapshots.createMany({
    values: [{ buildId, ...viewport, targetId }],
  });
  await dbClient.diffs.create({ snapshotId: snapshot!.id, baselineSnapshotId: baseline!.id });
  return { snapshotId: snapshot!.id, baselineId: baseline!.id };
};

const findBaselineSnapshotId = async (snapshotId: string) =>
  (await dbClient.snapshots.findById(snapshotId))?.baselineSnapshotId;

describe("backfillSnapshotBaselines", () => {
  test("should copy each diff's baseline onto its snapshot and finish", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const a = await seedComparedSnapshot(mainBuild.id, captureConfiguration, "a");
    const b = await seedComparedSnapshot(mainBuild.id, captureConfiguration, "b");
    const [noBaseline] = await dbClient.snapshots.createMany({
      values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "c" }],
    });
    await dbClient.diffs.create({ snapshotId: noBaseline!.id });

    await backfillSnapshotBaselines({ batchSize: 1, batchPauseMs: 0 });

    expect(await findBaselineSnapshotId(a.snapshotId)).toBe(a.baselineId);
    expect(await findBaselineSnapshotId(b.snapshotId)).toBe(b.baselineId);
    expect(await findBaselineSnapshotId(noBaseline!.id)).toBeNull();
    expect(await dbClient.backfills.find("snapshot_baselines")).toMatchObject({
      completedAt: expect.any(String),
    });
  });

  test("should leave a baseline the snapshot already recorded alone", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const [recorded, onDiff] = await dbClient.snapshots.createMany({
      values: ["a", "a"].map((targetId) => ({
        buildId: mainBuild.id,
        ...captureConfiguration,
        targetId,
      })),
    });
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [
        {
          buildId: mainBuild.id,
          ...captureConfiguration,
          targetId: "a",
          baselineSnapshotId: recorded!.id,
        },
      ],
    });
    await dbClient.diffs.create({ snapshotId: snapshot!.id, baselineSnapshotId: onDiff!.id });

    await backfillSnapshotBaselines({ batchPauseMs: 0 });

    expect(await findBaselineSnapshotId(snapshot!.id)).toBe(recorded!.id);
  });

  test("should carry on from where the last run stopped when it runs out of time", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const seeded = [];
    for (const targetId of ["a", "b", "c"]) {
      seeded.push(await seedComparedSnapshot(mainBuild.id, captureConfiguration, targetId));
    }

    await backfillSnapshotBaselines({ batchSize: 1, batchPauseMs: 0, timeBudgetMs: 0 });

    const copiedAfterOneRun = await Promise.all(
      seeded.map(({ snapshotId }) => findBaselineSnapshotId(snapshotId)),
    );
    expect(copiedAfterOneRun.filter(Boolean)).toHaveLength(1);
    expect(await dbClient.backfills.find("snapshot_baselines")).toMatchObject({
      cursor: expect.any(String),
      completedAt: null,
    });

    await backfillSnapshotBaselines({ batchSize: 1, batchPauseMs: 0 });

    expect(
      await Promise.all(seeded.map(({ snapshotId }) => findBaselineSnapshotId(snapshotId))),
    ).toEqual(seeded.map(({ baselineId }) => baselineId));
  });

  test("should do nothing once it has finished", async ({ mainBuild, captureConfiguration }) => {
    await backfillSnapshotBaselines({ batchPauseMs: 0 });
    const { snapshotId } = await seedComparedSnapshot(mainBuild.id, captureConfiguration, "a");

    await backfillSnapshotBaselines({ batchPauseMs: 0 });

    expect(await findBaselineSnapshotId(snapshotId)).toBeNull();
  });
});
