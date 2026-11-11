import { faker } from "@faker-js/faker";

import { ACCESS_TOKEN_PERMISSIONS, type AccessTokenSchema } from "@ovr/api/contracts/accessTokens";

export const generateAccessToken = (overrides?: Partial<AccessTokenSchema>): AccessTokenSchema => ({
  id: faker.string.uuid(),
  name: faker.word.noun(),
  permissions: ACCESS_TOKEN_PERMISSIONS,
  createdAt: faker.date.past(),
  lastRequest: null,
  ...overrides,
});
