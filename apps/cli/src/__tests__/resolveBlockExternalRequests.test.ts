import { describe, expect, it } from "vitest";

import { resolveBlockExternalRequests } from "../config";

describe("resolveBlockExternalRequests", () => {
  it("should leave it unset when no config exists or the config omits it", () => {
    expect(resolveBlockExternalRequests(undefined)).toBeUndefined();
    expect(resolveBlockExternalRequests({ diffThreshold: 0.1 })).toBeUndefined();
  });

  it("should use the config's 'blockExternalRequests' when set", () => {
    expect(resolveBlockExternalRequests({ blockExternalRequests: true })).toBe(true);
    expect(
      resolveBlockExternalRequests({ blockExternalRequests: { allow: [" Images.Example.com"] } }),
    ).toEqual({ allow: ["images.example.com"] });
  });

  it("should throw a clear error when an allowed host is invalid", () => {
    expect(() =>
      resolveBlockExternalRequests({
        blockExternalRequests: { allow: ["https://images.example.com/"] },
      }),
    ).toThrow(/blockExternalRequests.*https:\/\/images\.example\.com/);
  });
});
