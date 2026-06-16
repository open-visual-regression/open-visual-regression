import { eq } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { captureConfigurations } from "../schema";

type FindByProjectInput = { projectId: string; tx?: DbClient };

export const findByProject = ({ projectId, tx = db }: FindByProjectInput) =>
  tx.query.captureConfigurations.findMany({
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
