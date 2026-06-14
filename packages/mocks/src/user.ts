import { faker } from "@faker-js/faker";

import type { user } from "@ovr/db/schema";
import type { UserSchema } from "@ovr/api/contracts/users";

type User = typeof user.$inferSelect;

export const generateAuthUser = (overrides?: Partial<User>): User => ({
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

export const generateUser = (overrides?: Partial<UserSchema>): UserSchema => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: "user",
  createdAt: faker.date.past(),
  lastLoginAt: faker.date.recent(),
  ...overrides,
});
