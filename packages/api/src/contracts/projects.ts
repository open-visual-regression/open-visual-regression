import { InferContractRouterOutputs, oc } from "@orpc/contract";
import { z } from "zod";
import { describe } from "zod/mini";
import { de } from "zod/v4/locales";

export const projectCreatorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
});

export type ProjectCreatorDto = z.infer<typeof projectCreatorSchema>;

export const projectSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  description: z.string().max(511),
  gitMainBranch: z.string().min(1).max(255),
  diffThreshold: z.number().min(0.01).max(1),
  createdAt: z.string().nonempty(),
  createdBy: projectCreatorSchema,
});

export type ProjectDto = z.infer<typeof projectSchema>;

export const listProjectsOutputSchema = z.object({ projects: z.array(projectSchema) });

export const listProjectsContract = oc.output(listProjectsOutputSchema);

export type ListProjectsDto = InferContractRouterOutputs<typeof listProjectsContract>;

export const addProjectInputSchema = z.object({
  projectName: z.string().min(1).max(255),
  projectDescription: z.string().max(255),
  gitMainBranch: z.string().min(1).max(255),
  diffThreshold: z.number().min(0.01).max(1),
});

export const addProjectOutputSchema = z.object({
  projectId: z.uuidv7(),
});

export const addProjectContract = oc.input(addProjectInputSchema).output(addProjectOutputSchema);

export const contract = {
  list: listProjectsContract,
  add: addProjectContract,
} as const;
