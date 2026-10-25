import { faker } from "@faker-js/faker";

import type { BuildDetailSchema } from "@ovr/api/contracts/builds";
import type {
  BuildSnapshotSchema,
  SnapshotCountsSchema,
  SnapshotHistoryEntrySchema,
} from "@ovr/api/contracts/snapshots";

export const generateBuildSnapshot = (
  overrides?: Partial<BuildSnapshotSchema>,
): BuildSnapshotSchema => ({
  id: faker.string.uuid(),
  targetId: faker.word.noun(),
  targetTitle: faker.word.noun(),
  targetName: faker.word.noun(),
  status: "unchanged",
  imagePath: faker.system.filePath(),
  diffId: null,
  diffImagePath: null,
  diffPercent: null,
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  hasUncaughtPageError: false,
  isFlaky: false,
  flags: [],
  processingMs: null,
  ...overrides,
});

export const generateSnapshotHistoryEntry = (
  overrides?: Partial<SnapshotHistoryEntrySchema>,
): SnapshotHistoryEntrySchema => ({
  id: faker.string.uuid(),
  buildId: faker.string.uuid(),
  buildName: faker.git.commitMessage(),
  commitSha: faker.git.commitSha(),
  createdAt: faker.date.recent().toISOString(),
  status: "unchanged",
  diffPercent: null,
  variantId: faker.string.uuid(),
  imagePath: faker.system.filePath(),
  flags: [],
  ...overrides,
});

export const generateBuild = (overrides?: Partial<BuildDetailSchema>): BuildDetailSchema => ({
  id: faker.string.uuid(),
  project: {
    id: faker.string.uuid(),
    name: faker.company.name(),
  },
  branch: "main",
  commitSha: faker.git.commitSha(),
  name: faker.git.commitMessage(),
  author: faker.person.fullName(),
  errorMessage: null,
  status: "unchanged",
  canceledBy: null,
  isRebuildable: false,
  isReviewable: true,
  latestBuildId: null,
  commitUrl: null,
  branchUrl: null,
  buildType: "storybook",
  createdAt: faker.date.recent().toISOString(),
  queuedMs: 12_000,
  processingMs: 122_000,
  durationMs: 134_000,
  ...overrides,
});

export const generateSnapshotCounts = (
  overrides?: Partial<SnapshotCountsSchema>,
): SnapshotCountsSchema => ({
  unchanged: 0,
  auto_approved: 0,
  approved: 0,
  needs_review: 0,
  rejected: 0,
  error: 0,
  canceled: 0,
  skipped: 0,
  queued: 0,
  processing: 0,
  ...overrides,
});
