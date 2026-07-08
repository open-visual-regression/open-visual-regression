import { faker } from "@faker-js/faker";

import type { BuildDetailSchema } from "@ovr/api/contracts/builds";
import type { BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";

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
  buildType: "storybook",
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});
