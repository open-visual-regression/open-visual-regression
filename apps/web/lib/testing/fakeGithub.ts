import { generateKeyPairSync } from "node:crypto";

import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { clearInstallationTokens } from "@ovr/git-status/providers/github/app/tokens";
import { createFakeGithub, type FakeGithubOptions } from "@ovr/mocks/handlers/github";

const CLIENT_ID = "Iv23liExample";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

/**
 * Serves the shared fake GitHub to the server-side code under test for a whole suite, and
 * configures the instance's GitHub App to talk to it. Call `configure()` in a test that needs
 * the app; tests that don't see no app configured.
 */
export const useFakeGithub = (options: Partial<FakeGithubOptions> = {}) => {
  const fake = createFakeGithub({ clientId: CLIENT_ID, publicKey, ...options });
  const server = setupServer(...fake.handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
  afterEach(() => {
    fake.reset();
    clearInstallationTokens();
  });
  afterAll(() => server.close());

  return {
    fake,
    configure: () => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", CLIENT_ID);
      vi.stubEnv(
        "OVR_GITHUB_APP_PRIVATE_KEY",
        privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
      );
    },
    unconfigure: () => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
      vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
    },
  };
};
