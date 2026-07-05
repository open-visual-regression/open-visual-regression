import { oc } from "@orpc/contract";
import { z } from "zod";

import { browserSchema, snapshotDisplayStatusSchema } from "./builds";

export const snapshotLogSchema = z.object({
  id: z.uuidv7(),
  level: z.string().min(1),
  message: z.string(),
  timestamp: z.string().nonempty(),
});

export const snapshotSchema = z.object({
  id: z.uuidv7(),
  browser: z.string().min(1),
  viewportWidth: z.number().int(),
  viewportHeight: z.number().int().nullable(),
  targetName: z.string(),
  targetTitle: z.string(),
  imagePath: z.string().nullable(),
  status: snapshotDisplayStatusSchema,
  errorLogs: z.array(snapshotLogSchema),
});

export type SnapshotSchema = z.infer<typeof snapshotSchema>;

export const getOneInputSchema = z.object({ snapshotId: z.uuidv7() });

export const getOneOutputSchema = z.object({ snapshot: snapshotSchema });

export const getOneContract = oc.input(getOneInputSchema).output(getOneOutputSchema);

export const buildSnapshotSchema = z.object({
  id: z.uuidv7(),
  targetId: z.string().min(1),
  targetTitle: z.string().min(1),
  targetName: z.string().min(1),
  status: snapshotDisplayStatusSchema,
  imagePath: z.string().nullable(),
  diffId: z.uuidv7().nullable(),
  diffImagePath: z.string().nullable(),
  diffPercent: z.number().nullable(),
  browser: z.string().min(1),
  viewportWidth: z.number().int(),
  viewportHeight: z.number().int().nullable(),
});

export type BuildSnapshotSchema = z.infer<typeof buildSnapshotSchema>;

export const snapshotSortColumnSchema = z.enum([
  "status",
  "targetTitle",
  "targetName",
  "browser",
  "viewportWidth",
]);

export type SnapshotSortColumnSchema = z.infer<typeof snapshotSortColumnSchema>;

export const snapshotSortSchema = z.object({
  column: snapshotSortColumnSchema,
  direction: z.enum(["asc", "desc"]),
});

export type SnapshotSortSchema = z.infer<typeof snapshotSortSchema>;

export const snapshotViewportFilterSchema = z.object({
  viewportWidth: z.number().int(),
  viewportHeight: z.number().int().nullable(),
});

export type SnapshotViewportFilterSchema = z.infer<typeof snapshotViewportFilterSchema>;

export const listInputSchema = z.object({
  buildId: z.uuidv7(),
  statuses: z.array(snapshotDisplayStatusSchema).optional(),
  browsers: z.array(browserSchema).optional(),
  viewports: z.array(snapshotViewportFilterSchema).optional(),
  search: z.string().min(1).optional(),
  sortBy: z
    .array(snapshotSortSchema)
    .min(1)
    .default([
      { column: "status", direction: "asc" },
      { column: "targetTitle", direction: "asc" },
      { column: "targetName", direction: "asc" },
      { column: "browser", direction: "asc" },
      { column: "viewportWidth", direction: "asc" },
    ]),
  limit: z.number().int().min(1).max(100).default(24),
  offset: z.number().int().min(0).default(0),
});

export type ListInputSchema = z.infer<typeof listInputSchema>;

export const listOutputSchema = z.object({
  snapshots: z.array(buildSnapshotSchema),
  total: z.number().int().nonnegative(),
});

export const listContract = oc.input(listInputSchema).output(listOutputSchema);

export const snapshotCountsSchema = z.object({
  passed: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  needs_review: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
  queued: z.number().int().nonnegative(),
  processing: z.number().int().nonnegative(),
});

export type SnapshotCountsSchema = z.infer<typeof snapshotCountsSchema>;

export const getCountsInputSchema = z.object({
  buildId: z.uuidv7(),
});

export const getCountsContract = oc.input(getCountsInputSchema).output(snapshotCountsSchema);

export const getAdjacentInputSchema = z.object({ snapshotId: z.uuidv7() });

export const getAdjacentOutputSchema = z.object({
  prevSnapshotId: z.uuidv7().nullable(),
  nextSnapshotId: z.uuidv7().nullable(),
  position: z.number().int().positive().nullable(),
  total: z.number().int().positive().nullable(),
});

export type GetAdjacentOutputSchema = z.infer<typeof getAdjacentOutputSchema>;

export const getAdjacentContract = oc.input(getAdjacentInputSchema).output(getAdjacentOutputSchema);

export const listViewportsInputSchema = z.object({ buildId: z.uuidv7() });

export const listViewportsOutputSchema = z.object({
  viewports: z.array(snapshotViewportFilterSchema),
});

export const listViewportsContract = oc
  .input(listViewportsInputSchema)
  .output(listViewportsOutputSchema);

export const contract = {
  getOne: getOneContract,
  list: listContract,
  getCounts: getCountsContract,
  getAdjacent: getAdjacentContract,
  listViewports: listViewportsContract,
} as const;
