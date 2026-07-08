import { oc } from "@orpc/contract";
import { z } from "zod";

export const buildProcessingStatusSchema = z.enum([
  "queued",
  "processing",
  "success",
  "error",
  "canceled",
]);

export type BuildProcessingStatus = z.infer<typeof buildProcessingStatusSchema>;

export const buildReviewStatusSchema = z.enum([
  "not_required",
  "unchanged",
  "auto_approved",
  "needs_review",
  "approved",
  "rejected",
]);

export type BuildReviewStatus = z.infer<typeof buildReviewStatusSchema>;

export const buildStatusSchema = z.enum([
  "queued",
  "processing",
  "needs_review",
  "unchanged",
  "auto_approved",
  "approved",
  "rejected",
  "error",
  "canceled",
]);

export type BuildStatus = z.infer<typeof buildStatusSchema>;

export const buildTypeSchema = z.enum(["storybook"]);

export type BuildType = z.infer<typeof buildTypeSchema>;

export const browserSchema = z.enum(["chromium", "firefox", "webkit"]);

export type Browser = z.infer<typeof browserSchema>;

export const viewportSchema = z.object({
  name: z.string().min(1),
  browser: browserSchema,
  viewportWidth: z.number().int().min(320).max(3840),
  viewportHeight: z.number().int().min(240).max(2160).optional(),
  default: z.boolean().optional(),
});

export type ViewportSchema = z.infer<typeof viewportSchema>;

export const targetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  name: z.string().min(1),
});

export type TargetSchema = z.infer<typeof targetSchema>;

export const createBuildInputSchema = z.object({
  branch: z.string().min(1),
  commitSha: z.string().min(1),
  name: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  buildType: buildTypeSchema.optional(),
});

export type CreateBuildInputSchema = z.infer<typeof createBuildInputSchema>;

export const createBuildOutputSchema = z.object({
  buildId: z.string(),
  uploadUrl: z.string(),
});

export const createBuildContract = oc.input(createBuildInputSchema).output(createBuildOutputSchema);

export const confirmUploadInputSchema = z.object({
  buildId: z.string(),
  targets: z.array(targetSchema),
  viewports: z
    .array(viewportSchema)
    .min(1)
    .refine(
      (viewports) => new Set(viewports.map((viewport) => viewport.name)).size === viewports.length,
      { message: "viewport names must be unique" },
    ),
  diffThreshold: z.number().min(0.01).max(1).optional(),
});

export type ConfirmUploadInputSchema = z.infer<typeof confirmUploadInputSchema>;

export const confirmUploadOutputSchema = z.object({
  ok: z.literal(true),
});

export const confirmUploadContract = oc
  .input(confirmUploadInputSchema)
  .output(confirmUploadOutputSchema);

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
  buildType: buildTypeSchema,
  createdAt: z.string().nonempty(),
});

export type BuildSchema = z.infer<typeof buildSchema>;

export const buildDetailSchema = buildSchema.extend({
  canceledBy: z.string().min(1).nullable(),
});

export type BuildDetailSchema = z.infer<typeof buildDetailSchema>;

export const buildsCursorSchema = z.object({
  createdAt: z.string().nonempty(),
  id: z.uuidv7(),
});

export type BuildsCursor = z.infer<typeof buildsCursorSchema>;

export const listBuildsInputSchema = z.object({
  projectIds: z.array(z.uuidv7()).optional(),
  processingStatus: buildProcessingStatusSchema.optional(),
  reviewStatus: buildReviewStatusSchema.optional(),
  statuses: z.array(buildStatusSchema).optional(),
  branches: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: buildsCursorSchema.optional(),
});

export type ListBuildsInputSchema = z.infer<typeof listBuildsInputSchema>;

export const listBuildsOutputSchema = z.object({
  builds: z.array(buildSchema),
  total: z.number().int().nonnegative(),
  nextCursor: buildsCursorSchema.nullable(),
});

export const listBuildsContract = oc
  .input(listBuildsInputSchema.optional())
  .output(listBuildsOutputSchema);

export const snapshotDisplayStatusSchema = z.enum([
  "unchanged",
  "auto_approved",
  "approved",
  "needs_review",
  "rejected",
  "error",
  "canceled",
  "queued",
  "processing",
]);

export type SnapshotDisplayStatus = z.infer<typeof snapshotDisplayStatusSchema>;

export const getBuildInputSchema = z.object({
  buildId: z.uuidv7(),
});

export const getBuildOutputSchema = z.object({
  build: buildDetailSchema,
});

export const getBuildContract = oc.input(getBuildInputSchema).output(getBuildOutputSchema);

export const listBuildFilterOptionsInputSchema = z.object({
  projectId: z.uuidv7(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const listBranchesOutputSchema = z.object({
  branches: z.array(z.string()),
});

export const listBranchesContract = oc
  .input(listBuildFilterOptionsInputSchema)
  .output(listBranchesOutputSchema);

export const listAuthorsOutputSchema = z.object({
  authors: z.array(z.string()),
});

export const listAuthorsContract = oc
  .input(listBuildFilterOptionsInputSchema)
  .output(listAuthorsOutputSchema);

export const listBuildStatusesInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const listBuildStatusesOutputSchema = z.object({
  statuses: z.array(buildStatusSchema),
});

export const listStatusesContract = oc
  .input(listBuildStatusesInputSchema)
  .output(listBuildStatusesOutputSchema);

export const cancelBuildInputSchema = z.object({
  buildId: z.uuidv7(),
});

export const cancelBuildOutputSchema = z.object({
  ok: z.literal(true),
});

export const cancelBuildContract = oc.input(cancelBuildInputSchema).output(cancelBuildOutputSchema);

export const contract = {
  createBuild: createBuildContract,
  confirmUpload: confirmUploadContract,
  getBuildStatus: getBuildStatusContract,
  cancel: cancelBuildContract,
  list: listBuildsContract,
  getOne: getBuildContract,
  listBranches: listBranchesContract,
  listAuthors: listAuthorsContract,
  listStatuses: listStatusesContract,
} as const;
