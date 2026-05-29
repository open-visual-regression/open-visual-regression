import { db } from "../db";
import { projects } from "../schema";

export const listProjects = () => db.query.projects.findMany({ with: { creator: true } });

export type ListProjectsResult = Awaited<ReturnType<typeof listProjects>>;

export const addProject = async (values: typeof projects.$inferInsert) => {
  const [project] = await db.insert(projects).values(values).returning();
  return project;
};

export type ListProjectsResultDbSchema = Awaited<ReturnType<typeof listProjects>>;

export type ProjectDbSchema = ListProjectsResultDbSchema[number];

export type ProjectCreatorDbSchema = ProjectDbSchema["creator"];
