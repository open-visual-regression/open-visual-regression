import { isIP } from "node:net";

export type BrowserEngine = "chromium" | "firefox" | "webkit";

// A host captures may load besides the capture origin. `subdomains` matches hosts under
// `hostname` but not `hostname` itself, and a null port matches every port.
export type AllowedHost = {
  hostname: string;
  port: number | null;
  subdomains: boolean;
};

const LABEL = /^[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?$/;
const DEFAULT_PORTS: Record<string, number> = {
  "http:": 80,
  "https:": 443,
  "ws:": 80,
  "wss:": 443,
};

const splitPort = (entry: string): [host: string, port: string | undefined] => {
  const bracketed = /^(\[[^\]]*\])(?::(.*))?$/.exec(entry);
  if (bracketed) {
    return [bracketed[1]!, bracketed[2]];
  }
  const separator = entry.lastIndexOf(":");
  return separator === -1
    ? [entry, undefined]
    : [entry.slice(0, separator), entry.slice(separator + 1)];
};

const isValidHostname = (hostname: string): boolean => {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return isIP(hostname.slice(1, -1)) === 6;
  }
  if (/^[\d.]+$/.test(hostname)) {
    return isIP(hostname) === 4;
  }
  return hostname.length <= 253 && hostname.split(".").every((label) => LABEL.test(label));
};

const isIpAddress = (hostname: string): boolean => hostname.startsWith("[") || isIP(hostname) === 4;

export const parseAllowedHost = (entry: string): AllowedHost => {
  const value = entry.trim().toLowerCase();
  const invalid = (reason: string) => new Error(`"${entry.trim()}" ${reason}`);

  if (value === "*" || value === "*.*") {
    throw invalid("would allow every host; list each host instead");
  }
  if (value.includes("/")) {
    throw invalid("is not a host; list it without a scheme or path, like example.com");
  }
  if (value.startsWith(".")) {
    throw invalid(`is not a host; use *${value} to allow its subdomains`);
  }

  const subdomains = value.startsWith("*.");
  const [hostname, portText] = splitPort(subdomains ? value.slice(2) : value);

  if (hostname.includes("*")) {
    throw invalid("can only use a wildcard as its first label, like *.example.com");
  }
  if (!isValidHostname(hostname)) {
    throw invalid("is not a valid hostname or IP address");
  }
  if (subdomains && isIpAddress(hostname)) {
    throw invalid("can't use a wildcard with an IP address");
  }

  let port: number | null = null;
  if (portText !== undefined) {
    port = /^\d+$/.test(portText) ? Number(portText) : Number.NaN;
    if (!(port >= 1 && port <= 65_535)) {
      throw invalid("has a port that isn't a number from 1 to 65535");
    }
  }

  return { hostname, port, subdomains };
};

export const formatAllowedHost = ({ hostname, port, subdomains }: AllowedHost): string =>
  `${subdomains ? "*." : ""}${hostname}${port === null ? "" : `:${port}`}`;

// Accepts a comma-separated string or a list, and reports every invalid entry at once.
export const parseAllowedHosts = (value: string | readonly string[]): AllowedHost[] => {
  const entries = (typeof value === "string" ? value.split(",") : value)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const allowed = new Map<string, AllowedHost>();
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      const host = parseAllowedHost(entry);
      allowed.set(formatAllowedHost(host), host);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid allowed hosts: ${errors.join("; ")}`);
  }

  return [...allowed.values()];
};

// Matches the way Chromium reads the bypass list, which is the documented behavior.
export const isAllowedHost = (url: URL, allowedHosts: readonly AllowedHost[]): boolean => {
  const port = url.port === "" ? DEFAULT_PORTS[url.protocol] : Number(url.port);

  return allowedHosts.some(
    (host) =>
      (host.port === null || host.port === port) &&
      (host.subdomains
        ? url.hostname.endsWith(`.${host.hostname}`)
        : url.hostname === host.hostname),
  );
};

// Firefox matches the bypass list as hostname suffixes and ignores ports, so `*.example.com`
// becomes `.example.com`, and an IPv6 address is matched without its brackets.
const toFirefoxBypass = ({ hostname, subdomains }: AllowedHost): string => {
  const bare = hostname.replace(/^\[(.*)\]$/, "$1");
  return subdomains ? `.${bare}` : bare;
};

export const toProxyBypass = (
  engine: BrowserEngine,
  allowedHosts: readonly AllowedHost[],
): string[] =>
  engine === "firefox"
    ? [...new Set(allowedHosts.map(toFirefoxBypass))]
    : allowedHosts.map(formatAllowedHost);

// Entries an engine allows more broadly than written, so the operator isn't surprised.
export const describeAllowedHostLimits = (
  engine: string,
  allowedHosts: readonly AllowedHost[],
): string[] => {
  if (engine !== "firefox") {
    return [];
  }

  return allowedHosts
    .filter((host) => host.port !== null)
    .map(
      (host) =>
        `Firefox can't limit an allowed host to one port, so captures in Firefox can load ${formatAllowedHost({ ...host, port: null })} on any port (from "${formatAllowedHost(host)}").`,
    );
};

// What a capture lets through: null loads every host, and a list blocks every external host but
// the ones on it.
export type ExternalRequestAllowlist = AllowedHost[] | null;

const isHostList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

// Reads `blockExternalRequests` from ovr.config or a story's parameters.
export const parseBlockExternalRequests = (value: unknown): ExternalRequestAllowlist => {
  if (value === undefined || value === false) {
    return null;
  }
  if (value === true) {
    return [];
  }
  if (typeof value === "object" && value !== null && "allow" in value && isHostList(value.allow)) {
    return parseAllowedHosts(value.allow);
  }
  throw new Error("must be true, false, or { allow: [...hosts] }");
};

// The form stored with a build and its snapshots.
export const serializeAllowlist = (allowlist: ExternalRequestAllowlist): string[] | null =>
  allowlist === null ? null : allowlist.map(formatAllowedHost);

export const deserializeAllowlist = (
  stored: readonly string[] | null | undefined,
): ExternalRequestAllowlist => (stored == null ? null : parseAllowedHosts(stored));

// Equal for allowlists that block the same requests, so captures sharing one can share a page.
export const allowlistKey = (stored: readonly string[] | null | undefined): string =>
  stored == null ? "" : JSON.stringify([...stored].sort());
