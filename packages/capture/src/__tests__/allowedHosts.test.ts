import { describe, expect, test, vi } from "vitest";

import { getCaptureAllowedHosts, parseAllowedHostsEnv } from "../lib/allowedHosts";

describe("parseAllowedHostsEnv", () => {
  test("allows no external hosts when the variable is unset or empty", () => {
    expect(parseAllowedHostsEnv(undefined)).toEqual([]);
    expect(parseAllowedHostsEnv("")).toEqual([]);
    expect(parseAllowedHostsEnv(" ,, ")).toEqual([]);
  });

  test("reads a single host", () => {
    expect(parseAllowedHostsEnv("images.example.com")).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
    ]);
  });

  test("reads a comma-separated list, ignoring whitespace", () => {
    expect(parseAllowedHostsEnv(" images.example.com , *.fonts.net:443 ")).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
      { hostname: "fonts.net", port: 443, subdomains: true },
    ]);
  });

  test("fails on an invalid entry instead of falling back, naming the variable", () => {
    expect(() => parseAllowedHostsEnv("images.example.com,https://fonts.net/")).toThrow(
      /^OVR_CAPTURE_ALLOWED_HOSTS: .*"https:\/\/fonts\.net\/"/,
    );
  });
});

describe("getCaptureAllowedHosts", () => {
  test("reads OVR_CAPTURE_ALLOWED_HOSTS, following changes to it", () => {
    vi.stubEnv("OVR_CAPTURE_ALLOWED_HOSTS", "images.example.com");
    expect(getCaptureAllowedHosts()).toEqual([
      { hostname: "images.example.com", port: null, subdomains: false },
    ]);

    vi.stubEnv("OVR_CAPTURE_ALLOWED_HOSTS", "");
    expect(getCaptureAllowedHosts()).toEqual([]);
  });
});
