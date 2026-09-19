import type { LookupAddress } from "node:dns";
import dns from "node:dns/promises";

import { describe, expect, test, vi } from "vitest";

import { isPublicAddress, resolvePublicAddress } from "../lib/networkGuard";

const mockLookupAll = (records: LookupAddress[]) =>
  vi
    .spyOn(dns, "lookup")
    .mockImplementationOnce((async () => records) as unknown as typeof dns.lookup);

describe("networkGuard", () => {
  describe("isPublicAddress", () => {
    test.each([
      ["8.8.8.8", true],
      ["93.184.216.34", true],
      ["172.32.0.1", true],
      ["2606:4700:4700::1111", true],
      ["127.0.0.1", false],
      ["10.0.0.5", false],
      ["172.16.0.1", false],
      ["172.31.255.255", false],
      ["192.168.1.1", false],
      ["169.254.169.254", false],
      ["100.64.0.1", false],
      ["0.0.0.0", false],
      ["255.255.255.255", false],
      ["::1", false],
      ["fe80::1", false],
      ["fd00::1", false],
      ["not-an-address", false],
    ])("classifies %s as public=%s", (address, expected) => {
      expect(isPublicAddress(address)).toBe(expected);
    });

    test.each([
      ["::ffff:127.0.0.1"],
      ["::ffff:7f00:1"],
      ["::ffff:a00:1"],
      ["0:0:0:0:0:ffff:7f00:1"],
    ])("treats the IPv4-mapped address %s as private", (address) => {
      expect(isPublicAddress(address)).toBe(false);
    });
  });

  describe("resolvePublicAddress", () => {
    test("pins the address a public hostname resolves to", async () => {
      mockLookupAll([{ address: "93.184.216.34", family: 4 }]);
      expect(await resolvePublicAddress("example.com")).toBe("93.184.216.34");
    });

    test("refuses a hostname that resolves to a private address", async () => {
      mockLookupAll([{ address: "169.254.169.254", family: 4 }]);
      expect(await resolvePublicAddress("metadata.internal")).toBeNull();
    });

    test("refuses a hostname with any private address among multiple records", async () => {
      mockLookupAll([
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ]);
      expect(await resolvePublicAddress("mixed.example.com")).toBeNull();
    });

    test("refuses a hostname that fails to resolve", async () => {
      vi.spyOn(dns, "lookup").mockRejectedValueOnce(new Error("ENOTFOUND"));
      expect(await resolvePublicAddress("does-not-exist.invalid")).toBeNull();
    });

    test.each([
      ["127.0.0.1", null],
      ["[::1]", null],
      ["[::ffff:7f00:1]", null],
      ["1.1.1.1", "1.1.1.1"],
      ["[2606:4700:4700::1111]", "2606:4700:4700::1111"],
    ])("resolves the literal address %s without a DNS lookup", async (hostname, expected) => {
      const lookup = vi.spyOn(dns, "lookup");
      expect(await resolvePublicAddress(hostname)).toBe(expected);
      expect(lookup).not.toHaveBeenCalled();
    });
  });
});
