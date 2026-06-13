import { eq } from "drizzle-orm";

import { db } from "../db";
import { projects } from "../schema";

export const findById = (id: string) =>
  db.query.projects.findFirst({ where: (projects, { eq }) => eq(projects.id, id) });

type GetProjectInput = {
  projectId: string;
  organizationId: string;
};

export const getProject = async ({ projectId, organizationId }: GetProjectInput) =>
  db.query.projects.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      diffThreshold: true,
      gitMainBranch: true,
      createdAt: true,
    },
    with: { creator: { columns: { id: true, name: true, email: true } } },
    where: (projects, { eq, and }) =>
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });

type ListProjectsInput = {
  organizationId: string;
};

export const listProjects = ({ organizationId }: ListProjectsInput) =>
  db.query.projects.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
      diffThreshold: true,
      gitMainBranch: true,
      createdAt: true,
    },
    with: { creator: { columns: { id: true, name: true, email: true } } },
    where: (projects, { eq }) => eq(projects.organizationId, organizationId),
  });

export type ListProjectsResult = Awaited<ReturnType<typeof listProjects>>;

export const addProject = async (values: typeof projects.$inferInsert) => {
  const [project] = await db.insert(projects).values(values).returning();
  return project;
};

export const updateProject = async (id: string, patch: Partial<typeof projects.$inferInsert>) => {
  const [project] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
  return project;
};

export const deleteProject = async (id: string) => {
  await db.delete(projects).where(eq(projects.id, id));
};

export type ListProjectsResultDbSchema = Awaited<ReturnType<typeof listProjects>>;

export type ProjectDbSchema = ListProjectsResultDbSchema[number];

export type ProjectCreatorDbSchema = ProjectDbSchema["creator"];
