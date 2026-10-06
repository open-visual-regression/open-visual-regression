import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("jobSettings", () => {
  describe("find", () => {
    test("should return undefined when the job's settings have never been saved", async () => {
      expect(await dbClient.jobSettings.find("flaky_detection")).toBeUndefined();
    });
  });

  describe("upsert", () => {
    test("should store the job's settings and who saved them", async ({ user }) => {
      await dbClient.jobSettings.upsert({
        job: "flaky_detection",
        settings: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });

      expect(await dbClient.jobSettings.find("flaky_detection")).toMatchObject({
        job: "flaky_detection",
        settings: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });
    });

    test("should replace the job's settings when they are saved again", async ({ user }) => {
      await dbClient.jobSettings.upsert({
        job: "flaky_detection",
        settings: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });

      await dbClient.jobSettings.upsert({
        job: "flaky_detection",
        settings: { enabled: false },
        updatedBy: user.id,
      });

      const saved = await dbClient.jobSettings.find("flaky_detection");
      expect(saved?.settings).toEqual({ enabled: false });
    });
  });
});
