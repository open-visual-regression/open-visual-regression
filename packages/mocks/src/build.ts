import { faker } from "@faker-js/faker";

import type { BuildSchema, BuildSnapshotSchema } from "@ovr/api/contracts/builds";

export const generateBuildSnapshot = (
  overrides?: Partial<BuildSnapshotSchema>,
): BuildSnapshotSchema => ({
  id: faker.string.uuid(),
  targetId: faker.word.noun(),
  targetTitle: faker.word.noun(),
  targetName: faker.word.noun(),
  status: "pass",
  imagePath: faker.system.filePath(),
  diffId: null,
  diffImagePath: null,
  diffPercent: null,
  captureConfiguration: {
    id: faker.string.uuid(),
    name: faker.word.noun(),
    browser: "chromium",
    viewportWidth: 1280,
    viewportHeight: 800,
  },
  ...overrides,
});

export const generateBuild = (overrides?: Partial<BuildSchema>): BuildSchema => ({
  id: faker.string.uuid(),
  project: {
    id: faker.string.uuid(),
    name: faker.company.name(),
  },
  branch: "main",
  commitSha: faker.git.commitSha(),
  name: faker.git.commitMessage(),
  author: faker.person.fullName(),
  status: "passed",
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});
