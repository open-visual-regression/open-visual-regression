import { faker } from "@faker-js/faker";

import type { BuildDetailSchema } from "@ovr/api/contracts/builds";
import type { BuildSnapshotSchema, SnapshotCountsSchema } from "@ovr/api/contracts/snapshots";

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
  ...overrides,
});

export const generateBuild = (overrides?: Partial<BuildDetailSchema>): BuildDetailSchema => {
  const createdAt = overrides?.createdAt ? new Date(overrides.createdAt) : faker.date.recent();
  const startedAt = new Date(createdAt.getTime() + 12_000);
  const finishedAt = new Date(startedAt.getTime() + 100_000);

  return {
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
    commitUrl: null,
    branchUrl: null,
    buildType: "storybook",
    createdAt: createdAt.toISOString(),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    ...overrides,
  };
};

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
