import { z } from "zod";

export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

export const ALLOWED_HOST_PATTERN = /^(\*\.)?([^:]+)(?::(\d+))?$/;

const portSchema = z.coerce.number().int().min(1).max(65_535);

const allowedHostSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (entry) => {
      const [, , hostname, port] = ALLOWED_HOST_PATTERN.exec(entry) ?? [];
      return (
        z.hostname().safeParse(hostname).success &&
        (port === undefined || portSchema.safeParse(port).success)
      );
    },
    {
      error: (issue) =>
        `"${issue.input}" must be a host like example.com, example.com:8443 or *.example.com`,
    },
  );

export const blockExternalRequestsSchema = z.union([
  z.boolean(),
  z.object({ allow: z.array(allowedHostSchema).max(100) }),
]);

export type BlockExternalRequests = z.output<typeof blockExternalRequestsSchema>;

// null blocks nothing; [] blocks every external host.
export const toExternalRequestAllowlist = (
  blockExternalRequests: BlockExternalRequests | undefined,
): string[] | null => {
  if (blockExternalRequests === undefined || blockExternalRequests === false) {
    return null;
  }
  return blockExternalRequests === true ? [] : [...new Set(blockExternalRequests.allow)].sort();
};

export type OvrStoryParameters = {
  viewports?: OvrStoryParameterViewport[];
  diffThreshold?: number;
  waitForTimeout?: number;
  blockExternalRequests?: BlockExternalRequests;
  skip?: boolean;
};

/** Upper bound on `waitForTimeout`, so one story can't eat its whole capture job budget. */
export const MAX_WAIT_FOR_TIMEOUT_MS = 30_000;
