import { oc } from "@orpc/contract";
import { z } from "zod";

export const buildStatusSchema = z.enum(["pending", "needs_review", "passed", "error"]);

export type BuildStatus = z.infer<typeof buildStatusSchema>;

export const createBuildInputSchema = z.object({
  branch: z.string().min(1),
  commitSha: z.string().min(1),
  name: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  targets: z.array(z.string().min(1)),
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

export const contract = {
  createBuild: createBuildContract,
  getBuildStatus: getBuildStatusContract,
  list: listBuildsContract,
} as const;
