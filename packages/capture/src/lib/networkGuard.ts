import dns from "node:dns/promises";

import ipaddr from "ipaddr.js";

/** Strips the brackets RFC 3986 puts around an IPv6 literal; dns.lookup and ipaddr.js need it bare. */
const unwrapIpv6 = (hostname: string): string =>
  hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;

/**
 * Whether a literal IPv4/IPv6 `address` is publicly routable. IPv4-mapped
 * IPv6 addresses are unwrapped first so one can't hide a private IPv4 address.
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
 * Resolves `hostname` to a public address the caller can connect to
 * directly, or `null` if it's private or unresolvable.
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
