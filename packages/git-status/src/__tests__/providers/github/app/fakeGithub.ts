import { createFakeGithub, type FakeGithubOptions } from "@ovr/mocks/handlers/github";

import { server } from "../../../setup";
import { TEST_PRIVATE_KEY, TEST_PUBLIC_KEY } from "./testKeys";

export const TEST_CLIENT_ID = "Iv23liExample";

export const testAppConfig = { clientId: TEST_CLIENT_ID, privateKey: TEST_PRIVATE_KEY };

/** Mounts the shared fake GitHub on this suite's msw server for one test. */
export const useFakeGithub = (options: Partial<FakeGithubOptions> = {}) => {
  const fake = createFakeGithub({
    clientId: TEST_CLIENT_ID,
    publicKey: TEST_PUBLIC_KEY,
    ...options,
  });
  server.use(...fake.handlers);
  return fake;
};
