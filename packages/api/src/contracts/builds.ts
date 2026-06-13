import { oc } from "@orpc/contract";
import { z } from "zod";

export const buildStatusSchema = z.enum(["pending", "needs_review", "passed", "error"]);

export const createBuildInputSchema = z.object({
  branch: z.string().min(1),
  commitSha: z.string().min(1),
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

export const contract = {
  createBuild: createBuildContract,
  getBuildStatus: getBuildStatusContract,
} as const;
