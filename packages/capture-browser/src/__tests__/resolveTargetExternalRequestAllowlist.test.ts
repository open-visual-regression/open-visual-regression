import { describe, expect, it } from "vitest";

import type { OvrStoryParameters } from "@ovr/storybook-compat/parameters";

import { parseAllowedHosts } from "../allowedHosts";
import { resolveTargetExternalRequestAllowlist } from "../storyViewports";

const ALLOW_CDN = parseAllowedHosts("cdn.example.com");

describe("resolveTargetExternalRequestAllowlist", () => {
  it("should use the build default when the story has no override", () => {
    expect(resolveTargetExternalRequestAllowlist(null, undefined)).toBeNull();
    expect(resolveTargetExternalRequestAllowlist(ALLOW_CDN, { diffThreshold: 0.1 })).toBe(
      ALLOW_CDN,
    );
  });

  it("should let a story turn blocking on when the build doesn't block", () => {
    expect(resolveTargetExternalRequestAllowlist(null, { blockExternalRequests: true })).toEqual(
      [],
    );
  });

  it("should let a story turn blocking off when the build blocks", () => {
    expect(
      resolveTargetExternalRequestAllowlist(ALLOW_CDN, { blockExternalRequests: false }),
    ).toBeNull();
  });

  it("should replace the build's allowed hosts rather than add to them", () => {
    expect(
      resolveTargetExternalRequestAllowlist(ALLOW_CDN, {
        blockExternalRequests: { allow: ["fonts.example.com"] },
      }),
    ).toEqual(parseAllowedHosts("fonts.example.com"));
  });

  it("should throw, naming the parameter, rather than fall back on an invalid value", () => {
    expect(() =>
      resolveTargetExternalRequestAllowlist(null, {
        blockExternalRequests: "yes",
      } as unknown as OvrStoryParameters),
    ).toThrow(/parameters\.ovr\.blockExternalRequests/);
  });
});
