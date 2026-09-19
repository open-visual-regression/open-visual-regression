import dns from "node:dns/promises";

import ipaddr from "ipaddr.js";

// Callers pass a URL/authority host component, so an IPv6 literal arrives
// bracket-wrapped per RFC 3986 (e.g. "[::1]"). Neither `dns.lookup` nor
// ipaddr.js accept the brackets, so strip them before parsing.
const unwrapIpv6 = (hostname: string): string =>
  hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;

/**
 * Whether `address` — a literal IPv4 or IPv6 address, not a hostname — is
 * publicly routable (not private, loopback, link-local, or otherwise
 * reserved). IPv4-mapped IPv6 addresses (e.g. "::ffff:a00:1") are unwrapped
 * to their IPv4 form first, so one can't be used to smuggle a private IPv4
 * address past the check.
 */
export const isPublicAddress = (address: string): boolean => {
  let parsed;
  try {
    parsed = ipaddr.parse(address);
  } catch {
    return false;
  }

  if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
    parsed = parsed.toIPv4Address();
  }

  return parsed.range() === "unicast";
};

/**
 * Resolves `hostname` — a URL/authority host component, possibly a
 * bracket-wrapped IPv6 literal — to a single public address, or `null` if
 * it's a private literal, every address it resolves to is private, or it
 * fails to resolve. Returning one pinned address (rather than a bool) lets
 * the caller connect to the exact address that was checked, instead of
 * trusting a second DNS lookup made later that could resolve differently.
 */
export const resolvePublicAddress = async (hostname: string): Promise<string | null> => {
  const literal = unwrapIpv6(hostname);

  if (ipaddr.isValid(literal)) {
    return isPublicAddress(literal) ? literal : null;
  }

  let records;
  try {
    records = await dns.lookup(literal, { all: true });
  } catch {
    return null;
  }

  const addresses = records.map((record) => record.address);
  if (addresses.length === 0 || !addresses.every(isPublicAddress)) {
    return null;
  }

  return addresses[0] ?? null;
};
