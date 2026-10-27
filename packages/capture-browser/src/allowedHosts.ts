import { ALLOWED_HOST_PATTERN } from "@ovr/storybook-compat/parameters";

type AllowedHost = { hostname: string; port: number | null; subdomains: boolean };

const DEFAULT_PORTS: Record<string, number> = {
  "http:": 80,
  "https:": 443,
  "ws:": 80,
  "wss:": 443,
};

const toAllowedHost = (entry: string): AllowedHost => {
  const [, wildcard, hostname = "", port] = ALLOWED_HOST_PATTERN.exec(entry) ?? [];
  return {
    hostname,
    port: port === undefined ? null : Number(port),
    subdomains: Boolean(wildcard),
  };
};

// Matches the bypass rules the way Chromium does.
export const isAllowedUrl = (url: URL, allowlist: readonly string[]): boolean => {
  const port = url.port === "" ? DEFAULT_PORTS[url.protocol] : Number(url.port);

  return allowlist
    .map(toAllowedHost)
    .some(
      (host) =>
        (host.port === null || host.port === port) &&
        (host.subdomains
          ? url.hostname.endsWith(`.${host.hostname}`)
          : url.hostname === host.hostname),
    );
};

// Firefox matches bypass entries as hostname suffixes, without ports.
export const toProxyBypass = (browserName: string, allowlist: readonly string[]): string[] => {
  if (browserName !== "firefox") {
    return [...allowlist];
  }
  const suffixes = allowlist
    .map(toAllowedHost)
    .map(({ hostname, subdomains }) => (subdomains ? `.${hostname}` : hostname));
  return [...new Set(suffixes)];
};
