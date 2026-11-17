import { vi } from "vitest";

import { DEFAULT_DIFF_SETTINGS, type DiffSettings } from "@ovr/api/contracts/settings";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("settings", () => {
  test("should return UNAUTHORIZED for the diff settings when no session cookie is provided", async () => {
    const [error] = await serverClient.settings.getDiff();
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should return FORBIDDEN for the diff settings when the session user is not an admin", async ({
    reviewer: _,
  }) => {
    const [error] = await serverClient.settings.getDiff();
    expect(error?.code).toBe("FORBIDDEN");
  });

  test("should return the default diff settings when none have been saved", async ({
    admin: _,
  }) => {
    const [error, result] = await serverClient.settings.getDiff();

    expect(error).toBeNull();
    expect(result?.settings).toEqual(DEFAULT_DIFF_SETTINGS);
  });

  test("should return UNAUTHORIZED when saving diff settings without a session cookie", async () => {
    const [error] = await serverClient.settings.updateDiff({ algorithm: "pixel" });
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should return FORBIDDEN when a user who is not an admin saves diff settings", async ({
    reviewer: _,
  }) => {
    const [error] = await serverClient.settings.updateDiff({ algorithm: "pixel" });
    expect(error?.code).toBe("FORBIDDEN");
  });

  test("should return BAD_REQUEST for an unknown diff algorithm", async ({ admin: _ }) => {
    const [error] = await serverClient.settings.updateDiff({
      algorithm: "fuzzy",
    } as unknown as DiffSettings);
    expect(error?.code).toBe("BAD_REQUEST");
  });

  test("should save the diff settings so they are returned afterwards", async ({ admin: _ }) => {
    const [updateError] = await serverClient.settings.updateDiff({ algorithm: "pixel" });
    const [, result] = await serverClient.settings.getDiff();

    expect(updateError).toBeNull();
    expect(result?.settings).toEqual({ algorithm: "pixel" });
  });
});
