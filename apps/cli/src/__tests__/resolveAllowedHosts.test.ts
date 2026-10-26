import { describe, expect, it } from "vitest";

import { resolveAllowedHosts } from "../config";

describe("resolveAllowedHosts", () => {
  it("should allow no external hosts when no config exists", () => {
    expect(resolveAllowedHosts(undefined)).toEqual([]);
  });

  it("should allow no external hosts when the config omits 'capture.allowedHosts'", () => {
    expect(resolveAllowedHosts({ capture: {} })).toEqual([]);
  });

  it("should use the config's 'capture.allowedHosts' when set", () => {
    expect(
      resolveAllowedHosts({ capture: { allowedHosts: ["images.example.com", "*.fonts.net"] } }),
    ).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
      { hostname: "fonts.net", port: null, subdomains: true },
    ]);
  });

  it("should replace the config's list with the --allowed-hosts flag", () => {
    expect(
      resolveAllowedHosts(
        { capture: { allowedHosts: ["images.example.com"] } },
        " cdn.example.com:8443 , ",
      ),
    ).toEqual([{ hostname: "cdn.example.com", port: 8443, subdomains: false }]);
  });

  it("should let an empty --allowed-hosts flag clear the config's list", () => {
    expect(resolveAllowedHosts({ capture: { allowedHosts: ["images.example.com"] } }, "")).toEqual(
      [],
    );
  });

  it("should name the config key when an entry is invalid", () => {
    expect(() =>
      resolveAllowedHosts({ capture: { allowedHosts: ["https://images.example.com/"] } }),
    ).toThrow(/capture\.allowedHosts.*https:\/\/images\.example\.com/);
  });

  it("should name the flag when an entry is invalid", () => {
    expect(() => resolveAllowedHosts(undefined, "*")).toThrow(/--allowed-hosts/);
  });

  it("should reject a config value that isn't a list", () => {
    expect(() =>
      resolveAllowedHosts({ capture: { allowedHosts: "images.example.com" as never } }),
    ).toThrow(/must be a list/);
  });
});
