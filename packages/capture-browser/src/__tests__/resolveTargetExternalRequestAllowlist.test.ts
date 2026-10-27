import { describe, expect, it } from "vitest";

import type { OvrStoryParameters } from "@ovr/storybook-compat/parameters";

import { resolveTargetExternalRequestAllowlist } from "../storyViewports";

describe("resolveTargetExternalRequestAllowlist", () => {
  it("should use the build default when the story has no override", () => {
    expect(resolveTargetExternalRequestAllowlist(null, undefined)).toBeNull();
    expect(
      resolveTargetExternalRequestAllowlist(["cdn.example.com"], { diffThreshold: 0.1 }),
    ).toEqual(["cdn.example.com"]);
  });

  it("should use the story's override, replacing the build's allowed hosts", () => {
    expect(resolveTargetExternalRequestAllowlist(null, { blockExternalRequests: true })).toEqual(
      [],
    );
    expect(
      resolveTargetExternalRequestAllowlist(["cdn.example.com"], { blockExternalRequests: false }),
    ).toBeNull();
    expect(
      resolveTargetExternalRequestAllowlist(["cdn.example.com"], {
        blockExternalRequests: { allow: ["fonts.example.com"] },
      }),
    ).toEqual(["fonts.example.com"]);
  });

  it("should fall back to the build default when the override is invalid", () => {
    expect(
      resolveTargetExternalRequestAllowlist(["cdn.example.com"], {
        blockExternalRequests: { allow: ["https://fonts.example.com/"] },
      } as OvrStoryParameters),
    ).toEqual(["cdn.example.com"]);
  });
});
