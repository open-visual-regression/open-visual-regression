import { z } from "zod";

import { parseAllowedHosts, type AllowedHost } from "@ovr/capture-browser/allowedHosts";

export const ALLOWED_HOSTS_ENV = "OVR_CAPTURE_ALLOWED_HOSTS";

// Unlike the worker's numeric settings, a bad entry fails instead of falling back to the default,
// so a typo can't quietly leave a host blocked.
const allowedHostsSchema = z.coerce
  .string()
  .default("")
  .transform((value, context) => {
    try {
      return parseAllowedHosts(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : String(error),
      });
      return z.NEVER;
    }
  });

export const parseAllowedHostsEnv = (value: string | undefined): AllowedHost[] => {
  const result = allowedHostsSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`${ALLOWED_HOSTS_ENV}: ${result.error.issues[0]?.message}`);
  }
  return result.data;
};

let cached: { value: string | undefined; hosts: AllowedHost[] } | undefined;

// External hosts captures may load, from OVR_CAPTURE_ALLOWED_HOSTS. Everything else is blocked.
export const getCaptureAllowedHosts = (): AllowedHost[] => {
  const value = process.env[ALLOWED_HOSTS_ENV];
  if (cached === undefined || cached.value !== value) {
    cached = { value, hosts: parseAllowedHostsEnv(value) };
  }
  return cached.hosts;
};
