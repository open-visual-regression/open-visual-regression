import { oc } from "@orpc/contract";
import { z } from "zod";

const redirectOutputSchema = z.object({
  status: z.literal(302),
  headers: z.object({
    location: z.string(),
    "cache-control": z.string(),
  }),
});

export const getBaselineBuildRedirectInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getBaselineBuildRedirectContract = oc
  .route({ method: "GET", path: "/{projectId}", outputStructure: "detailed" })
  .input(getBaselineBuildRedirectInputSchema)
  .output(redirectOutputSchema);

export const getBaselineStorybookRedirectInputSchema = z.object({
  projectId: z.uuidv7(),
  path: z.string().min(1).optional(),
});

export const getBaselineStorybookRedirectContract = oc
  .route({ method: "GET", path: "/{projectId}/storybook", outputStructure: "detailed" })
  .input(getBaselineStorybookRedirectInputSchema)
  .output(redirectOutputSchema);

export const contract = {
  getBuild: getBaselineBuildRedirectContract,
  getStorybook: getBaselineStorybookRedirectContract,
} as const;
