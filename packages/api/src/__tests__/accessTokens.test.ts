import { describe, expect, test } from "vitest";

import { accessTokenPermissionsSchema } from "../contracts/accessTokens";

describe("accessTokens", () => {
  describe("accessTokenPermissionsSchema", () => {
    test("should reject an action a resource does not have", () => {
      expect(accessTokenPermissionsSchema.safeParse({ reviews: ["read"] }).success).toBe(false);
    });
  });
});
