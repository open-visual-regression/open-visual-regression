import { faker } from "@faker-js/faker";

import type { diffs, snapshots } from "@ovr/db/schema";

type Snapshot = typeof snapshots.$inferSelect;
type Diff = typeof diffs.$inferSelect;

export const generateSnapshot = (overrides?: Partial<Snapshot>): Snapshot => ({
  id: faker.string.uuid(),
  buildId: faker.string.uuid(),
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: faker.word.noun(),
  targetTitle: faker.word.noun(),
  targetName: faker.word.noun(),
  status: "success",
  imagePath: faker.system.filePath(),
  hasRenderError: false,
  diffThreshold: 0.05,
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const generateDiff = (overrides?: Partial<Diff>): Diff => ({
  id: faker.string.uuid(),
  snapshotId: faker.string.uuid(),
  baselineSnapshotId: faker.string.uuid(),
  processingStatus: "success",
  reviewStatus: "not_required",
  diffImagePath: null,
  pixelDiffCount: null,
  diffPercent: null,
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});
