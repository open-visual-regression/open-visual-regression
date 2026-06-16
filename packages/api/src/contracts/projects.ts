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
  retentionDays: z.number().int().min(1),
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

export const updateProjectInputSchema = z.object({
  id: z.uuidv7(),
  patch: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(511).optional(),
    gitMainBranch: z.string().min(1).max(255).optional(),
    diffThreshold: z.number().min(0.01).max(1).optional(),
    retentionDays: z.number().int().min(1).optional(),
  }),
});

export const updateProjectContract = oc.input(updateProjectInputSchema).output(z.void());

export const captureConfigurationSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  browser: z.enum(["chromium", "firefox", "webkit"]),
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
});

export type CaptureConfigurationDto = z.infer<typeof captureConfigurationSchema>;

export const listCaptureConfigurationsInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const listCaptureConfigurationsOutputSchema = z.object({
  captureConfigurations: z.array(captureConfigurationSchema),
});

export const listCaptureConfigurationsContract = oc
  .input(listCaptureConfigurationsInputSchema)
  .output(listCaptureConfigurationsOutputSchema);

export const addCaptureConfigurationInputSchema = z.object({
  projectId: z.uuidv7(),
  data: z.object({
    name: z.string().min(1).max(255),
    browser: z.enum(["chromium", "firefox", "webkit"]),
    viewportWidth: z.number().int().positive(),
    viewportHeight: z.number().int().positive(),
  }),
});

export const addCaptureConfigurationContract = oc
  .input(addCaptureConfigurationInputSchema)
  .output(z.void());

export const removeCaptureConfigurationInputSchema = z.object({
  captureConfigurationId: z.uuidv7(),
});

export const removeCaptureConfigurationContract = oc
  .input(removeCaptureConfigurationInputSchema)
  .output(z.void());

export const contract = {
  getOne: getOneContract,
  list: listProjectsContract,
  add: addProjectContract,
  update: updateProjectContract,
  listCaptureConfigurations: listCaptureConfigurationsContract,
  addCaptureConfiguration: addCaptureConfigurationContract,
  removeCaptureConfiguration: removeCaptureConfigurationContract,
} as const;
