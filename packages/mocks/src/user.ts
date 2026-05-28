import { faker } from "@faker-js/faker";

import type { user } from "@ovr/db/schema";

type User = typeof user.$inferSelect;

export const generateUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  emailVerified: false,
  image: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  role: null,
  banned: null,
  banReason: null,
  banExpires: null,
  ...overrides,
});
