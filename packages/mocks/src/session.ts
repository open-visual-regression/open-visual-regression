import { faker } from "@faker-js/faker";

import type { session } from "@ovr/db/schema/auth";

type Session = typeof session.$inferSelect;

export const generateSession = (overrides?: Partial<Session>): Session => ({
  id: faker.string.uuid(),
  expiresAt: faker.date.future(),
  token: faker.string.alphanumeric(64),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ipAddress: null,
  userAgent: null,
  userId: faker.string.uuid(),
  impersonatedBy: null,
  activeOrganizationId: null,
  ...overrides,
});
