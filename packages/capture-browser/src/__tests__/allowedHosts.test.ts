import { describe, expect, test } from "vitest";

import {
  describeAllowedHostLimits,
  formatAllowedHost,
  isAllowedHost,
  parseAllowedHost,
  parseAllowedHosts,
  toProxyBypass,
} from "../allowedHosts";

describe("parseAllowedHosts", () => {
  test("allows nothing for an empty value", () => {
    expect(parseAllowedHosts("")).toEqual([]);
    expect(parseAllowedHosts(" , ,")).toEqual([]);
    expect(parseAllowedHosts([])).toEqual([]);
  });

  test("reads a single host", () => {
    expect(parseAllowedHosts("images.example.com")).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
    ]);
  });

  test("reads several hosts, trimming whitespace and dropping duplicates", () => {
    expect(
      parseAllowedHosts(
        " Images.Example.com ,*.fonts.net:443,\timages.example.com, 10.0.0.5:8080 ",
      ),
    ).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
      { hostname: "fonts.net", port: 443, subdomains: true },
      { hostname: "10.0.0.5", port: 8080, subdomains: false },
    ]);
  });

  test("reads a list the same way as a comma-separated string", () => {
    expect(parseAllowedHosts(["a.example.com", " b.example.com "])).toEqual(
      parseAllowedHosts("a.example.com,b.example.com"),
    );
  });

  test("reads a bracketed IPv6 address with or without a port", () => {
    expect(parseAllowedHost("[2001:db8::1]")).toEqual({
      hostname: "[2001:db8::1]",
      port: null,
      subdomains: false,
    });
    expect(parseAllowedHost("[2001:db8::1]:8443").port).toBe(8443);
  });

  test.each([
    ["*", /every host/],
    ["https://images.example.com", /without a scheme or path/],
    ["images.example.com/assets", /without a scheme or path/],
    [".example.com", /\*\.example\.com/],
    ["images.*.example.com", /wildcard/],
    ["*example.com", /wildcard/],
    ["*.10.0.0.5", /IP address/],
    ["exa mple.com", /not a valid hostname/],
    ["-bad.example.com", /not a valid hostname/],
    ["300.1.1.1", /not a valid hostname/],
    ["2001:db8::1", /not a valid hostname/],
    ["example.com:0", /port/],
    ["example.com:65536", /port/],
    ["example.com:https", /port/],
    ["example.com:", /port/],
  ])("rejects %j", (entry, message) => {
    expect(() => parseAllowedHost(entry)).toThrow(message);
  });

  test("reports every invalid entry at once", () => {
    expect(() => parseAllowedHosts("ok.example.com,*,https://bad.example.com")).toThrow(
      /"\*".*; "https:\/\/bad\.example\.com"/,
    );
  });

  test("formats a host the way it was written", () => {
    for (const entry of ["example.com", "*.example.com:8443", "[::1]:80", "10.0.0.5"]) {
      expect(formatAllowedHost(parseAllowedHost(entry))).toBe(entry);
    }
  });
});

describe("isAllowedHost", () => {
  const allowed = parseAllowedHosts("images.example.com,*.fonts.net,cdn.example.com:8443");
  const check = (url: string) => isAllowedHost(new URL(url), allowed);

  test("matches an exact host on any port", () => {
    expect(check("https://images.example.com/a.png")).toBe(true);
    expect(check("http://images.example.com:8080/a.png")).toBe(true);
    expect(check("https://sub.images.example.com/a.png")).toBe(false);
  });

  test("matches a wildcard's subdomains but not the domain itself", () => {
    expect(check("https://static.fonts.net/a.woff2")).toBe(true);
    expect(check("https://a.b.fonts.net/a.woff2")).toBe(true);
    expect(check("https://fonts.net/a.woff2")).toBe(false);
    expect(check("https://evilfonts.net/a.woff2")).toBe(false);
  });

  test("matches a port, counting the scheme's default port", () => {
    expect(check("https://cdn.example.com:8443/a.png")).toBe(true);
    expect(check("https://cdn.example.com/a.png")).toBe(false);
    expect(
      isAllowedHost(
        new URL("https://cdn.example.com/a.png"),
        parseAllowedHosts("cdn.example.com:443"),
      ),
    ).toBe(true);
  });
});

describe("toProxyBypass", () => {
  const allowed = parseAllowedHosts("images.example.com,*.fonts.net,cdn.example.com:8443,[::1]:80");

  test("passes every entry through as written for Chromium and WebKit", () => {
    const expected = ["images.example.com", "*.fonts.net", "cdn.example.com:8443", "[::1]:80"];
    expect(toProxyBypass("chromium", allowed)).toEqual(expected);
    expect(toProxyBypass("webkit", allowed)).toEqual(expected);
  });

  test("writes hostname suffixes without ports for Firefox", () => {
    expect(toProxyBypass("firefox", allowed)).toEqual([
      "images.example.com",
      ".fonts.net",
      "cdn.example.com",
      "::1",
    ]);
  });
});

describe("describeAllowedHostLimits", () => {
  const allowed = parseAllowedHosts("images.example.com,cdn.example.com:8443");

  test("warns that Firefox allows a host with a port on every port", () => {
    const warnings = describeAllowedHostLimits("firefox", allowed);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/cdn\.example\.com on any port.*cdn\.example\.com:8443/);
  });

  test("has nothing to warn about for Chromium and WebKit", () => {
    expect(describeAllowedHostLimits("chromium", allowed)).toEqual([]);
    expect(describeAllowedHostLimits("webkit", allowed)).toEqual([]);
  });
});
