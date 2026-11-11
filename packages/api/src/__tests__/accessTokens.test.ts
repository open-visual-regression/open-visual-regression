import { describe, expect, test } from "vitest";

import { accessTokenPermissionsSchema, toTokenPermissions } from "../contracts/accessTokens";

describe("accessTokens", () => {
  describe("toTokenPermissions", () => {
    test("should grant reading builds when nothing else is asked for", () => {
      expect(toTokenPermissions()).toEqual({ builds: ["read"] });
    });

    test("should keep reading builds alongside writing them", () => {
      expect(toTokenPermissions({ builds: ["write"] })).toEqual({ builds: ["read", "write"] });
    });

    test("should add reviewing without dropping reading builds", () => {
      expect(toTokenPermissions({ reviews: ["write"] })).toEqual({
        builds: ["read"],
        reviews: ["write"],
      });
    });

    test("should leave out a resource that was given no actions", () => {
      expect(toTokenPermissions({ builds: [], reviews: [] })).toEqual({ builds: ["read"] });
    });
  });

  describe("accessTokenPermissionsSchema", () => {
    test("should reject an action a resource does not have", () => {
      expect(accessTokenPermissionsSchema.safeParse({ reviews: ["read"] }).success).toBe(false);
    });
  });
});
