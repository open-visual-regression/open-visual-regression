import type { DiffSchema } from "@ovr/api/contracts/diffs";

import { getStoragePath } from "@/lib/utils/storage";

import type { DiffImages } from "./types";

/**
 * A diff's overlays, as URLs. `diffImagePath` is the new snapshot's overlay;
 * its name predates the baseline having one.
 */
export const diffImagesOf = (diff: DiffSchema | null): DiffImages => ({
  baseline: getStoragePath(diff?.baselineDiffImagePath ?? null),
  newSnapshot: getStoragePath(diff?.diffImagePath ?? null),
});

/** Whether there's any overlay to show. */
export const hasDiffImages = ({ baseline, newSnapshot }: DiffImages) =>
  baseline !== null || newSnapshot !== null;

/**
 * Whether the diff marks each snapshot, so each overlay's color means what the
 * key says. Diffs made before the baseline had an overlay drew everything that
 * changed on the new snapshot alone, in red.
 */
export const isTwoSided = ({ baseline }: DiffImages) => baseline !== null;
