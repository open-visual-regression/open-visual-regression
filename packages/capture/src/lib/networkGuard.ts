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

export const isSafeExternalUrl = async (url: URL): Promise<boolean> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = unwrapIpv6(url.hostname);

  if (ipaddr.isValid(hostname)) {
    return isPublicAddress(hostname);
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((record) => isPublicAddress(record.address));
  } catch {
    return false;
  }
};
