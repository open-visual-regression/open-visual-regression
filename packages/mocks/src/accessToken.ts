import { faker } from "@faker-js/faker";

import type { AccessTokenSchema } from "@ovr/api/contracts/accessTokens";

export const generateAccessToken = (overrides?: Partial<AccessTokenSchema>): AccessTokenSchema => ({
  id: faker.string.uuid(),
  name: faker.word.noun(),
  createdAt: faker.date.past(),
  lastRequest: null,
  ...overrides,
});
