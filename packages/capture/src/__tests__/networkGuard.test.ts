import type { LookupAddress } from "node:dns";
import dns from "node:dns/promises";

import { describe, expect, test, vi } from "vitest";

import { isPrivateAddress, isSafeExternalUrl } from "../lib/networkGuard";

const mockLookupAll = (records: LookupAddress[]) =>
  vi
    .spyOn(dns, "lookup")
    .mockImplementationOnce((async () => records) as unknown as typeof dns.lookup);

describe("isPrivateAddress", () => {
  test.each([
    ["127.0.0.1", true],
    ["10.0.0.5", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["169.254.169.254", true], // cloud metadata endpoint
    ["0.0.0.0", true],
    ["8.8.8.8", false],
    ["93.184.216.34", false],
    ["172.32.0.1", false], // just outside 172.16.0.0/12
    ["::1", true],
    ["fe80::1", true],
    ["fd00::1", true],
    ["::ffff:169.254.169.254", true],
    ["2606:4700:4700::1111", false],
  ])("classifies %s as private=%s", (ip, expected) => {
    expect(isPrivateAddress(ip)).toBe(expected);
  });
});

describe("isSafeExternalUrl", () => {
  test("rejects non-http(s) protocols outright", async () => {
    expect(await isSafeExternalUrl(new URL("file:///etc/passwd"))).toBe(false);
    expect(await isSafeExternalUrl(new URL("ws://example.com"))).toBe(false);
  });

  test("allows a hostname that only resolves to public addresses", async () => {
    mockLookupAll([{ address: "93.184.216.34", family: 4 }]);
    expect(await isSafeExternalUrl(new URL("https://example.com/image.png"))).toBe(true);
  });

  test("blocks a hostname that resolves to a private address", async () => {
    mockLookupAll([{ address: "169.254.169.254", family: 4 }]);
    expect(await isSafeExternalUrl(new URL("http://metadata.internal/latest"))).toBe(false);
  });

  test("blocks a hostname with any private address among multiple resolved records", async () => {
    mockLookupAll([
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ]);
    expect(await isSafeExternalUrl(new URL("https://mixed.example.com"))).toBe(false);
  });

  test("blocks a literal private IP without doing a DNS lookup", async () => {
    const lookup = vi.spyOn(dns, "lookup");
    expect(await isSafeExternalUrl(new URL("http://127.0.0.1:9999/"))).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  test("blocks a hostname that fails to resolve", async () => {
    vi.spyOn(dns, "lookup").mockRejectedValueOnce(new Error("ENOTFOUND"));
    expect(await isSafeExternalUrl(new URL("https://does-not-exist.invalid"))).toBe(false);
  });
});
