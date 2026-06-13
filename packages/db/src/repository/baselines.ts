import { baselines } from "../schema";
import { db } from "../db";

export const find = (projectId: string, captureConfigurationId: string, targetId: string) =>
  db.query.baselines.findFirst({
    where: (baselines, { and, eq }) =>
      and(
        eq(baselines.projectId, projectId),
        eq(baselines.captureConfigurationId, captureConfigurationId),
        eq(baselines.targetId, targetId),
      ),
  });

export const upsert = async (values: typeof baselines.$inferInsert) => {
  const [baseline] = await db
    .insert(baselines)
    .values(values)
    .onConflictDoUpdate({
      target: [baselines.projectId, baselines.captureConfigurationId, baselines.targetId],
      set: {
        snapshotId: values.snapshotId,
        approvedAt: values.approvedAt,
        approvedBy: values.approvedBy,
      },
    })
    .returning();
  return baseline;
};

export const findByProject = (projectId: string) =>
  db.query.baselines.findMany({
    where: (baselines, { eq }) => eq(baselines.projectId, projectId),
  });

export type BaselineDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
