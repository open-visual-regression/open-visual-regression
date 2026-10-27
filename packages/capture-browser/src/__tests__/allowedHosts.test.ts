import { describe, expect, it } from "vitest";

import { isAllowedUrl, toProxyBypass } from "../allowedHosts";

describe("allowedHosts", () => {
  describe("isAllowedUrl", () => {
    const allowlist = ["images.example.com", "*.fonts.net", "cdn.example.com:8443"];
    const isAllowed = (url: string) => isAllowedUrl(new URL(url), allowlist);

    it("should match an exact host on any port, but not its subdomains", () => {
      expect(isAllowed("https://images.example.com/a.png")).toBe(true);
      expect(isAllowed("http://images.example.com:8080/a.png")).toBe(true);
      expect(isAllowed("https://sub.images.example.com/a.png")).toBe(false);
    });

    it("should match a wildcard's subdomains, but not the domain itself", () => {
      expect(isAllowed("https://static.fonts.net/a.woff2")).toBe(true);
      expect(isAllowed("https://fonts.net/a.woff2")).toBe(false);
      expect(isAllowed("https://evilfonts.net/a.woff2")).toBe(false);
    });

    it("should match a port, counting the scheme's default port", () => {
      expect(isAllowed("https://cdn.example.com:8443/a.png")).toBe(true);
      expect(isAllowed("https://cdn.example.com/a.png")).toBe(false);
      expect(isAllowedUrl(new URL("https://cdn.example.com/a.png"), ["cdn.example.com:443"])).toBe(
        true,
      );
    });
  });

  describe("toProxyBypass", () => {
    const allowlist = ["*.fonts.net", "cdn.example.com:8443", "images.example.com"];

    it.each(["chromium", "webkit"])("should pass the entries through for %s", (browserName) => {
      expect(toProxyBypass(browserName, allowlist)).toEqual(allowlist);
    });

    it("should write hostname suffixes without ports for Firefox", () => {
      expect(toProxyBypass("firefox", allowlist)).toEqual([
        ".fonts.net",
        "cdn.example.com",
        "images.example.com",
      ]);
    });
  });
});
