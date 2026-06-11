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
  diffThreshold: z.number().min(0.01).max(1),
  creator: projectCreatorSchema,
  createdAt: z.string().nonempty(),
});

export type ProjectDto = z.infer<typeof projectSchema>;

export const listProjectsOutputSchema = z.object({ projects: z.array(projectSchema) });

export const listProjectsContract = oc.output(listProjectsOutputSchema);

export type ListProjectsDto = InferContractRouterOutputs<typeof listProjectsContract>;

export const addProjectInputSchema = z.object({
  projectName: z.string().min(1).max(255),
  projectDescription: z.string().max(511),
  gitMainBranch: z.string().min(1).max(255),
  diffThreshold: z.number().min(0.01).max(1),
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

export const contract = {
  getOne: getOneContract,
  list: listProjectsContract,
  add: addProjectContract,
} as const;
