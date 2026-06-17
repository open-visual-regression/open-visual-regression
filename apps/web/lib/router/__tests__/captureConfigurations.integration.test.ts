import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const NONEXISTENT_PROJECT_ID = "01900000-0000-7000-8000-000000000000";
const NONEXISTENT_CAPTURE_CONFIG_ID = "01900000-0000-7000-8000-000000000001";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

describe("captureConfigurations", () => {
  describe("add", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.captureConfigurations.add({
        projectId: NONEXISTENT_PROJECT_ID,
        data: { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.captureConfigurations.add({
        projectId: NONEXISTENT_PROJECT_ID,
        data: { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return NOT_FOUND for an unknown project ID", async ({ admin: _ }) => {
      const [error] = await serverClient.captureConfigurations.add({
        projectId: NONEXISTENT_PROJECT_ID,
        data: { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should create a capture configuration", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.captureConfigurations.add({
        projectId,
        data: { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });

      expect(error).toBeNull();

      const [, listResult] = await serverClient.captureConfigurations.list({ projectId });
      expect(listResult?.captureConfigurations).toHaveLength(1);
      expect(listResult?.captureConfigurations[0]).toMatchObject({
        name: "desktop",
        browser: "chromium",
        viewportWidth: 1280,
        viewportHeight: 800,
      });
    });

    test("should return BAD_REQUEST when the 10-configuration limit is reached", async ({
      admin: _,
    }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      for (let i = 0; i < 10; i++) {
        await serverClient.captureConfigurations.add({
          projectId,
          data: {
            name: `config-${i}`,
            browser: "chromium",
            viewportWidth: 1280,
            viewportHeight: 800,
          },
        });
      }

      const [error] = await serverClient.captureConfigurations.add({
        projectId,
        data: { name: "over-limit", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });
  });

  describe("remove", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.captureConfigurations.remove({
        captureConfigurationId: NONEXISTENT_CAPTURE_CONFIG_ID,
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.captureConfigurations.remove({
        captureConfigurationId: NONEXISTENT_CAPTURE_CONFIG_ID,
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the capture configuration", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.captureConfigurations.add({
        projectId,
        data: { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 },
      });

      const [, listResult] = await serverClient.captureConfigurations.list({ projectId });
      const configId = listResult!.captureConfigurations[0]!.id;

      const [error] = await serverClient.captureConfigurations.remove({
        captureConfigurationId: configId,
      });

      expect(error).toBeNull();

      const [, afterList] = await serverClient.captureConfigurations.list({ projectId });
      expect(afterList?.captureConfigurations).toHaveLength(0);
    });
  });
});
