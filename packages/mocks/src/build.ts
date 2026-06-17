import { faker } from "@faker-js/faker";

import type { BuildSchema } from "@ovr/api/contracts/builds";

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
