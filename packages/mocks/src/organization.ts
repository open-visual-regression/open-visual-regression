import { faker } from "@faker-js/faker";

import type { organization } from "@ovr/db/schema";

type Organization = typeof organization.$inferSelect;

export const generateOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  slug: faker.lorem.slug(),
  logo: null,
  createdAt: faker.date.past(),
  metadata: null,
  ...overrides,
});
