import { faker } from "@faker-js/faker";
import type { ProjectDto } from "@ovr/api/contracts/projects";

export const generateProject = (overrides?: Partial<ProjectDto>): ProjectDto => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  gitMainBranch: "main",
  retentionDays: 90,
  requiredReviewerCount: 1,
  creator: {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
  },
  createdAt: faker.date.past().toISOString(),
  ...overrides,
});
