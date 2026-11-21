import { sql } from "drizzle-orm";

import { db } from "../db";
import { jobState, type JobName } from "../schema";

export const find = (job: JobName) =>
  db.query.jobState.findFirst({
    where: (jobState, { eq }) => eq(jobState.job, job),
  });

export const markRun = async (job: JobName) => {
  await db
    .insert(jobState)
    .values({ job, lastRunAt: sql`now()` })
    .onConflictDoUpdate({ target: jobState.job, set: { lastRunAt: sql`now()` } });
};

export type JobStateDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
