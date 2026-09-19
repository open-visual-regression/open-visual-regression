import dns from "node:dns/promises";

import ipaddr from "ipaddr.js";

const unwrapIpv6 = (hostname: string): string =>
  hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;

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
