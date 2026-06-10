import { count, eq } from "drizzle-orm";

import { db } from "../db";
import { captureConfigurations } from "../schema";

export const findByProject = (projectId: string) =>
  db.query.captureConfigurations.findMany({
    where: (captureConfigurations, { eq }) => eq(captureConfigurations.projectId, projectId),
  });

export type FindByProjectResult = Awaited<ReturnType<typeof findByProject>>;

export type CaptureConfigurationDbSchema = FindByProjectResult[number];

export const addCaptureConfiguration = async (
  values: typeof captureConfigurations.$inferInsert,
) => {
  const [captureConfiguration] = await db.insert(captureConfigurations).values(values).returning();
  return captureConfiguration;
};

export const deleteCaptureConfiguration = async (id: string) => {
  await db.delete(captureConfigurations).where(eq(captureConfigurations.id, id));
};

export const countByProject = async (projectId: string) => {
  const [result] = await db
    .select({ count: count() })
    .from(captureConfigurations)
    .where(eq(captureConfigurations.projectId, projectId));

  return result?.count ?? 0;
};
