import dns from "node:dns/promises";
import net from "node:net";

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [a, b] = parts as [number, number, number, number];

  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8
    a === 127 || // 127.0.0.0/8 loopback
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) // 192.168.0.0/16
  );
};

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIPv4(normalized.slice(7));
  }

  return (
    normalized === "::1" || // loopback
    normalized === "::" || // unspecified
    /^f[cd][0-9a-f]{2}:/.test(normalized) || // fc00::/7 unique local
    /^fe[89ab][0-9a-f]:/.test(normalized) // fe80::/10 link-local
  );
};

export const isPrivateAddress = (ip: string): boolean =>
  net.isIPv6(ip) ? isPrivateIPv6(ip) : isPrivateIPv4(ip);

// The capture worker renders arbitrary customer-uploaded Storybook builds in a
// server-side browser, so a story's <img>, fetch(), or MSW passthrough could
// otherwise be used to reach internal infrastructure (e.g. the cloud metadata
// endpoint at 169.254.169.254). This resolves the hostname and only allows the
// request through when every resolved address is public.
export const isSafeExternalUrl = async (url: URL): Promise<boolean> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  if (net.isIP(url.hostname)) {
    return !isPrivateAddress(url.hostname);
  }

  try {
    const records = await dns.lookup(url.hostname, { all: true });
    return records.length > 0 && records.every((record) => !isPrivateAddress(record.address));
  } catch {
    return false;
  }
};
