import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("settings", () => {
  test("should return undefined for a setting that has never been saved", async () => {
    expect(await dbClient.settings.find("diff")).toBeUndefined();
  });

  test("should store a setting and who saved it", async ({ user }) => {
    await dbClient.settings.upsert({
      key: "diff",
      value: { algorithm: "exact" },
      updatedBy: user.id,
    });

    expect(await dbClient.settings.find("diff")).toMatchObject({
      key: "diff",
      value: { algorithm: "exact" },
      updatedBy: user.id,
    });
  });

  test("should replace a setting when it is saved again", async ({ user }) => {
    await dbClient.settings.upsert({
      key: "diff",
      value: { algorithm: "exact" },
      updatedBy: user.id,
    });

    await dbClient.settings.upsert({
      key: "diff",
      value: { algorithm: "smart" },
      updatedBy: user.id,
    });

    expect((await dbClient.settings.find("diff"))?.value).toEqual({ algorithm: "smart" });
  });
});
