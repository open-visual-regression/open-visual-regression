import { setTimeout as sleep } from "node:timers/promises";

import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";

const logger = createLogger("builds");

const SNAPSHOT_BASELINES = "snapshot_baselines";

export type BackfillOptions = {
  batchSize?: number;
  batchPauseMs?: number;
  timeBudgetMs?: number;
  // How long a batch may wait on a row lock the app holds before the run gives up and retries.
  lockTimeoutMs?: number;
};

export const DEFAULT_BACKFILL_OPTIONS = {
  batchSize: 5000,
  batchPauseMs: 200,
  timeBudgetMs: 10 * 60 * 1000,
  lockTimeoutMs: 5000,
} as const satisfies Required<BackfillOptions>;

// Snapshots compared before they recorded their own baseline only have it on their diff. Copies
// it over in batches, a time budget at a time, saving how far it got with each batch so the
// next run carries on from there. Once every diff has been visited, runs return straight away.
export const backfillSnapshotBaselines = async (options: BackfillOptions = {}): Promise<void> => {
  const { batchSize, batchPauseMs, timeBudgetMs, lockTimeoutMs } = {
    ...DEFAULT_BACKFILL_OPTIONS,
    ...options,
  };
  const progress = await dbClient.backfills.find(SNAPSHOT_BASELINES);

  if (progress?.completedAt) {
    return;
  }

  const startedAt = Date.now();
  let cursor = progress?.cursor ?? null;
  let copied = 0;
  let batches = 0;

  for (;;) {
    const batch = await dbClient.backfills.copySnapshotBaselinesBatch(
      cursor,
      batchSize,
      lockTimeoutMs,
    );

    if (!batch.lastDiffId) {
      await dbClient.backfills.complete(SNAPSHOT_BASELINES);
      logger.info(
        { copied, batches, durationMs: Date.now() - startedAt },
        "finished backfilling snapshot baselines",
      );
      return;
    }

    cursor = batch.lastDiffId;
    copied += batch.copied;
    batches++;

    if (Date.now() - startedAt >= timeBudgetMs) {
      logger.info(
        { copied, batches, durationMs: Date.now() - startedAt, timeBudgetMs },
        "snapshot baseline backfill hit its time budget; the next run carries on",
      );
      return;
    }

    await sleep(batchPauseMs);
  }
};
