import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { test as vitest, vi } from "vitest";

import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";

import { readGitHubAppConfig, type GitHubAppConfig } from "../githubApp/config";
import { generateAppPrivateKey, startFakeGitHub, type FakeGitHub } from "./fakeGitHub";

export { describe, expect } from "vitest";

type Clock = { advance: (ms: number) => void };

type Fixtures = {
  metrics: TestMetrics;
  encryptionKey: string;
  githubApp: GitHubAppConfig;
  github: FakeGitHub;
  clock: Clock;
  githubAppPrivateKey: string;
  writeTempFile: (contents: string) => string;
};

export const test = vitest.extend<Fixtures>({
  metrics: metricsFixture,

  // eslint-disable-next-line no-empty-pattern
  encryptionKey: async ({}, use) => {
    const key = randomBytes(32).toString("base64");
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", key);
    await use(key);
  },

  // Generating an RSA key is slow, so the worker shares one.
  githubAppPrivateKey: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(generateAppPrivateKey());
    },
    { scope: "worker" },
  ],

  // eslint-disable-next-line no-empty-pattern
  writeTempFile: async ({}, use) => {
    const dir = mkdtempSync(join(tmpdir(), "ovr-git-status-"));
    let count = 0;
    await use((contents) => {
      count += 1;
      const path = join(dir, `file-${count}`);
      writeFileSync(path, contents);
      return path;
    });
    rmSync(dir, { recursive: true, force: true });
  },

  githubApp: async ({ githubAppPrivateKey, writeTempFile }, use) => {
    vi.stubEnv("OVR_GITHUB_APP_ID", "1234");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY_FILE", writeTempFile(githubAppPrivateKey));
    await use(readGitHubAppConfig()!);
  },

  github: async ({ githubApp }, use) => {
    await use(startFakeGitHub(githubApp));
  },

  // eslint-disable-next-line no-empty-pattern
  clock: async ({}, use) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await use({ advance: (ms) => vi.setSystemTime(Date.now() + ms) });
    vi.useRealTimers();
  },
});
