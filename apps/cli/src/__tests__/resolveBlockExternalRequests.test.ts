import { describe, expect, it } from "vitest";

import { resolveBlockExternalRequests } from "../config";

describe("resolveBlockExternalRequests", () => {
  it("should block nothing when no config exists", () => {
    expect(resolveBlockExternalRequests(undefined)).toBeNull();
  });

  it("should block nothing when the config omits 'blockExternalRequests' or sets it to false", () => {
    expect(resolveBlockExternalRequests({ diffThreshold: 0.1 })).toBeNull();
    expect(resolveBlockExternalRequests({ blockExternalRequests: false })).toBeNull();
  });

  it("should block every external host when 'blockExternalRequests' is true", () => {
    expect(resolveBlockExternalRequests({ blockExternalRequests: true })).toEqual([]);
  });

  it("should block every external host but the allowed ones", () => {
    expect(
      resolveBlockExternalRequests({
        blockExternalRequests: { allow: [" images.example.com", "*.fonts.net:443"] },
      }),
    ).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
      { hostname: "fonts.net", port: 443, subdomains: true },
    ]);
  });

  it("should name the option when an allowed host is invalid", () => {
    expect(() =>
      resolveBlockExternalRequests({
        blockExternalRequests: { allow: ["https://images.example.com/"] },
      }),
    ).toThrow(/blockExternalRequests.*https:\/\/images\.example\.com/);
  });

  it("should reject a value of the wrong shape", () => {
    expect(() =>
      resolveBlockExternalRequests({ blockExternalRequests: ["images.example.com"] as never }),
    ).toThrow(/blockExternalRequests.*true, false, or \{ allow/);
  });
});
