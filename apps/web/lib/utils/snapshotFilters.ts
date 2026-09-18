import { z } from "zod";

import { snapshotDisplayStatusSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

export type SnapshotFiltersSearchParams = Record<string, string | string[] | undefined>;

export type SnapshotFilters = {
  search?: string;
  statuses: SnapshotDisplayStatus[];
  browsers: string[];
  viewports: string[];
};

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const searchParamsSchema = z.object({
  search: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
  status: z.preprocess(toArray, z.array(snapshotDisplayStatusSchema)).optional().catch(undefined),
  browser: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
  viewport: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
});

export const parseSnapshotFilters = (
  searchParams: SnapshotFiltersSearchParams,
): SnapshotFilters => {
  const {
    search,
    status = [],
    browser = [],
    viewport = [],
  } = searchParamsSchema.parse(searchParams);

  return { search, statuses: status, browsers: browser, viewports: viewport };
};

export const snapshotFiltersQuery = ({
  search,
  statuses,
  browsers,
  viewports,
}: SnapshotFilters): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }
  statuses.forEach((status) => params.append("status", status));
  browsers.forEach((browser) => params.append("browser", browser));
  viewports.forEach((viewport) => params.append("viewport", viewport));

  return params.toString();
};

export const withSnapshotFiltersQuery = (path: string, query: string): string =>
  query ? `${path}?${query}` : path;
