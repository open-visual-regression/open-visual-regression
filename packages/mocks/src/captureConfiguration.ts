import { faker } from "@faker-js/faker";

import type { CaptureConfigurationDto } from "@ovr/api/contracts/captureConfigurations";

export const generateCaptureConfiguration = (
  overrides?: Partial<CaptureConfigurationDto>,
): CaptureConfigurationDto => ({
  id: faker.string.uuid(),
  name: faker.word.noun(),
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  ...overrides,
});
