import { z } from "zod";

import { snapshotFlagSchema } from "@ovr/api/contracts/snapshots";

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const baselineSnapshotsSearchParamsSchema = z.object({
  project: z.preprocess(toArray, z.array(z.uuidv7())).optional().catch(undefined),
  flag: z.preprocess(toArray, z.array(snapshotFlagSchema)).optional().catch(undefined),
});

export const parseBaselineSnapshotsSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const { project: projectIds = [], flag: flags = [] } =
    baselineSnapshotsSearchParamsSchema.parse(searchParams);

  return { projectIds, flags };
};
