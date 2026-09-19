import { z } from "zod";

import { buildStatusSchema } from "@ovr/api/contracts/builds";

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const buildsSearchParamsSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.preprocess(toArray, z.array(buildStatusSchema)).optional().catch(undefined),
  branch: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
  author: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
});

export const parseBuildsSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const {
    search,
    status: statuses = [],
    branch: branches = [],
    author: authors = [],
  } = buildsSearchParamsSchema.parse(searchParams);

  return { search, statuses, branches, authors };
};
