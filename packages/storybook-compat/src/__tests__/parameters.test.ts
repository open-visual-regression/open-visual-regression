import { describe, expect, it } from "vitest";

import { blockExternalRequestsSchema, toExternalRequestAllowlist } from "../parameters";

describe("parameters", () => {
  describe("blockExternalRequestsSchema", () => {
    it.each([true, false])("accepts %s", (value) => {
      expect(blockExternalRequestsSchema.parse(value)).toBe(value);
    });

    it("accepts hosts, hosts with a port, and wildcard subdomains, trimmed and lowercased", () => {
      expect(
        blockExternalRequestsSchema.parse({
          allow: [" Images.Example.com", "cdn.example.com:8443", "*.fonts.net", "10.0.0.5"],
        }),
      ).toEqual({
        allow: ["images.example.com", "cdn.example.com:8443", "*.fonts.net", "10.0.0.5"],
      });
    });

    it.each([
      "*",
      "https://images.example.com",
      "images.example.com/assets",
      ".example.com",
      "images.*.example.com",
      "exa mple.com",
      "example.com:0",
      "example.com:65536",
      "example.com:",
    ])("rejects %j, naming the entry", (entry) => {
      const result = blockExternalRequestsSchema.safeParse({ allow: [entry] });
      expect(result.error?.issues[0]?.message).toContain(`"${entry}"`);
    });

    it.each([["yes"], [{}], [{ allow: "images.example.com" }]])("rejects %j", (value) => {
      expect(blockExternalRequestsSchema.safeParse(value).success).toBe(false);
    });
  });

  describe("toExternalRequestAllowlist", () => {
    it("blocks nothing when unset or false", () => {
      expect(toExternalRequestAllowlist(undefined)).toBeNull();
      expect(toExternalRequestAllowlist(false)).toBeNull();
    });

    it("blocks every external host when true", () => {
      expect(toExternalRequestAllowlist(true)).toEqual([]);
    });

    it("sorts and dedupes the allowed hosts, so equal allowlists compare equal", () => {
      expect(toExternalRequestAllowlist({ allow: ["b.com", "a.com", "b.com"] })).toEqual([
        "a.com",
        "b.com",
      ]);
    });
  });
});
