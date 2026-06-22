import { oc } from "@orpc/contract";
import { z } from "zod";

export const buildStatusSchema = z.enum(["pending", "needs_review", "passed", "rejected", "error"]);

export type BuildStatus = z.infer<typeof buildStatusSchema>;

export const viewportSchema = z.object({
  name: z.string().min(1).optional(),
  browser: z.enum(["chromium", "firefox", "webkit"]),
  viewportWidth: z.number().int().min(320).max(3840),
  viewportHeight: z.number().int().min(240).max(2160).optional(),
  default: z.boolean().optional(),
});

export type ViewportSchema = z.infer<typeof viewportSchema>;

export const createBuildInputSchema = z.object({
  branch: z.string().min(1),
  commitSha: z.string().min(1),
  name: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  targets: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      name: z.string().min(1),
    }),
  ),
  viewports: z.array(viewportSchema).min(1),
  diffThreshold: z.number().min(0.01).max(1).optional(),
});

export type CreateBuildInputSchema = z.infer<typeof createBuildInputSchema>;

export const createBuildOutputSchema = z.object({
  buildId: z.string(),
  uploadUrl: z.string(),
});

export const createBuildContract = oc.input(createBuildInputSchema).output(createBuildOutputSchema);

export const getBuildStatusInputSchema = z.object({
  buildId: z.string(),
});

export const getBuildStatusOutputSchema = z.object({
  status: buildStatusSchema,
  reviewUrl: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const getBuildStatusContract = oc
  .input(getBuildStatusInputSchema)
  .output(getBuildStatusOutputSchema);

export const buildSchema = z.object({
  id: z.uuidv7(),
  project: z.object({
    id: z.uuidv7(),
    name: z.string().min(1),
  }),
  branch: z.string().min(1),
  commitSha: z.string().min(1),
  name: z.string().min(1).nullable(),
  author: z.string().min(1).nullable(),
  errorMessage: z.string().nullable(),
  status: buildStatusSchema,
  createdAt: z.string().nonempty(),
});

export type BuildSchema = z.infer<typeof buildSchema>;

export const listBuildsInputSchema = z.object({
  projectIds: z.array(z.uuidv7()).optional(),
  status: buildStatusSchema.optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ListBuildsInputSchema = z.infer<typeof listBuildsInputSchema>;

export const listBuildsOutputSchema = z.object({
  builds: z.array(buildSchema),
  total: z.number().int().nonnegative(),
});

export const listBuildsContract = oc
  .input(listBuildsInputSchema.optional())
  .output(listBuildsOutputSchema);

export const snapshotDisplayStatusSchema = z.enum([
  "pass",
  "changed",
  "rejected",
  "fail",
  "pending",
]);

export type SnapshotDisplayStatus = z.infer<typeof snapshotDisplayStatusSchema>;

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

export const getBuildInputSchema = z.object({
  buildId: z.uuidv7(),
});

export const getBuildOutputSchema = z.object({
  build: buildSchema,
  snapshots: z.array(buildSnapshotSchema),
});

export const getBuildContract = oc.input(getBuildInputSchema).output(getBuildOutputSchema);

export const snapshotCountsSchema = z.object({
  pass: z.number().int().nonnegative(),
  changed: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  fail: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
});

export type SnapshotCountsSchema = z.infer<typeof snapshotCountsSchema>;

export const getSnapshotCountsInputSchema = z.object({
  buildId: z.uuidv7(),
});

export const getSnapshotCountsContract = oc
  .input(getSnapshotCountsInputSchema)
  .output(snapshotCountsSchema);

export const contract = {
  createBuild: createBuildContract,
  getBuildStatus: getBuildStatusContract,
  list: listBuildsContract,
  getOne: getBuildContract,
  getSnapshotCounts: getSnapshotCountsContract,
} as const;
