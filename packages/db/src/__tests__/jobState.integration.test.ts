import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("jobState", () => {
  test("should return undefined until the job has run", async () => {
    expect(await dbClient.jobState.find("flaky_detection")).toBeUndefined();
  });

  test("should record when the job last ran", async () => {
    const before = Date.now();

    await dbClient.jobState.markRun("flaky_detection");

    const state = await dbClient.jobState.find("flaky_detection");
    expect(new Date(state?.lastRunAt ?? 0).getTime()).toBeGreaterThanOrEqual(before - 1_000);
  });

  test("should move the last run forward when the job runs again", async () => {
    await dbClient.jobState.markRun("flaky_detection");
    const first = await dbClient.jobState.find("flaky_detection");

    await dbClient.jobState.markRun("flaky_detection");

    const second = await dbClient.jobState.find("flaky_detection");
    expect(new Date(second?.lastRunAt ?? 0).getTime()).toBeGreaterThan(
      new Date(first?.lastRunAt ?? 0).getTime(),
    );
  });
});
