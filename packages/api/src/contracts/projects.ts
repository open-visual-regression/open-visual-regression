import { InferContractRouterOutputs, oc } from "@orpc/contract";
import { z } from "zod";

export const projectCreatorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
});

export type ProjectCreatorDto = z.infer<typeof projectCreatorSchema>;

export const projectSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  description: z.string().max(511).nullable(),
  gitMainBranch: z.string().min(1).max(255),
  retentionDays: z.number().int().min(1),
  requiredReviewerCount: z.number().int().min(1),
  creator: projectCreatorSchema,
  createdAt: z.string().nonempty(),
});

export type ProjectDto = z.infer<typeof projectSchema>;

export const listProjectsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ListProjectsInputSchema = z.infer<typeof listProjectsInputSchema>;

export const listProjectsOutputSchema = z.object({ projects: z.array(projectSchema) });

export const listProjectsContract = oc
  .input(listProjectsInputSchema.optional())
  .output(listProjectsOutputSchema);

export type ListProjectsDto = InferContractRouterOutputs<typeof listProjectsContract>;

export const countProjectsOutputSchema = z.object({ total: z.number().int().nonnegative() });

export const countProjectsContract = oc.output(countProjectsOutputSchema);

export const addProjectInputSchema = z.object({
  projectName: z.string().min(1).max(255),
  projectDescription: z.string().max(511),
  gitMainBranch: z.string().min(1).max(255),
});

export type AddProjectInputSchema = z.infer<typeof addProjectInputSchema>;

export const addProjectOutputSchema = z.object({
  projectId: z.uuidv7(),
});

export const addProjectContract = oc.input(addProjectInputSchema).output(addProjectOutputSchema);

export const getOneInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getOneOutputSchema = z.object({
  project: projectSchema,
});

export const getOneContract = oc.input(getOneInputSchema).output(getOneOutputSchema);

export const updateProjectInputSchema = z.object({
  id: z.uuidv7(),
  patch: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(511).optional(),
    gitMainBranch: z.string().min(1).max(255).optional(),
    retentionDays: z.number().int().min(1).optional(),
    requiredReviewerCount: z.number().int().min(1).optional(),
  }),
});

export const updateProjectContract = oc.input(updateProjectInputSchema).output(z.void());

export const contract = {
  getOne: getOneContract,
  list: listProjectsContract,
  count: countProjectsContract,
  add: addProjectContract,
  update: updateProjectContract,
} as const;
