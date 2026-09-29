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
  totalBuildsCount: z.number().int().nonnegative(),
  creator: projectCreatorSchema,
  createdAt: z.string().nonempty(),
});

export type ProjectDto = z.infer<typeof projectSchema>;

export const projectsSortBySchema = z.enum(["name", "totalBuildsCount", "createdAt"]);

export type ProjectsSortBy = z.infer<typeof projectsSortBySchema>;

export const projectsSortDirectionSchema = z.enum(["asc", "desc"]);

export type ProjectsSortDirection = z.infer<typeof projectsSortDirectionSchema>;

export const projectsCursorSchema = z.object({
  sortBy: projectsSortBySchema,
  value: z.union([z.string(), z.number()]),
  id: z.uuidv7(),
});

export type ProjectsCursor = z.infer<typeof projectsCursorSchema>;

export const listProjectsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: projectsCursorSchema.optional(),
  sortBy: projectsSortBySchema.default("totalBuildsCount"),
  sortDirection: projectsSortDirectionSchema.default("desc"),
});

export type ListProjectsInputSchema = z.infer<typeof listProjectsInputSchema>;

export const listProjectsOutputSchema = z.object({
  projects: z.array(projectSchema),
  nextCursor: projectsCursorSchema.nullable(),
});

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

export const getBaselineBuildInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getBaselineBuildOutputSchema = z.object({
  build: z
    .object({
      id: z.uuidv7(),
      commitSha: z.string().min(1),
      createdAt: z.string().nonempty(),
    })
    .nullable(),
});

export type GetBaselineBuildOutput = z.infer<typeof getBaselineBuildOutputSchema>;

export const getBaselineBuildContract = oc
  .input(getBaselineBuildInputSchema)
  .output(getBaselineBuildOutputSchema);

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

export const deleteProjectInputSchema = z.object({
  id: z.uuidv7(),
});

export type DeleteProjectInputSchema = z.infer<typeof deleteProjectInputSchema>;

export const deleteProjectContract = oc.input(deleteProjectInputSchema).output(z.void());

export const contract = {
  getOne: getOneContract,
  getBaselineBuild: getBaselineBuildContract,
  list: listProjectsContract,
  count: countProjectsContract,
  add: addProjectContract,
  update: updateProjectContract,
  deleteProject: deleteProjectContract,
} as const;
