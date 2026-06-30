import { faker } from "@faker-js/faker";
import type { ApiKeySchema } from "@ovr/api/contracts/apiKeys";

export const generateApiKey = (overrides?: Partial<ApiKeySchema>): ApiKeySchema => ({
  id: faker.string.uuid(),
  name: faker.word.noun(),
  ownerName: faker.person.fullName(),
  createdAt: faker.date.past(),
  lastRequest: null,
  ...overrides,
});
