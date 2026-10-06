import { eq, sql } from "drizzle-orm";

import { db } from "../db";
import { jobSettings, type JobName } from "../schema";

export const find = (job: JobName) =>
  db.query.jobSettings.findFirst({
    where: (jobSettings, { eq }) => eq(jobSettings.job, job),
  });

type UpsertInput = {
  job: JobName;
  settings: Record<string, unknown>;
  updatedBy: string;
};

export const upsert = async ({ job, settings, updatedBy }: UpsertInput) => {
  const [row] = await db
    .insert(jobSettings)
    .values({ job, settings, updatedBy })
    .onConflictDoUpdate({
      target: jobSettings.job,
      set: { settings, updatedBy, updatedAt: sql`now()` },
    })
    .returning();
  return row;
};

export const markRun = async (job: JobName) => {
  await db
    .update(jobSettings)
    .set({ lastRunAt: sql`now()` })
    .where(eq(jobSettings.job, job));
};

export type JobSettingsDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
