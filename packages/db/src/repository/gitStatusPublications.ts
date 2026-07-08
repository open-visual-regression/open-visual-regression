import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import { builds, gitStatusPublications } from "../schema";

export const record = async (values: typeof gitStatusPublications.$inferInsert) => {
  const [publication] = await db.insert(gitStatusPublications).values(values).returning();
  return publication;
};

export const findLatestByBuild = (buildId: string) =>
  db.query.gitStatusPublications.findFirst({
    where: (gitStatusPublications, { eq }) => eq(gitStatusPublications.buildId, buildId),
    orderBy: (gitStatusPublications, { desc }) => desc(gitStatusPublications.createdAt),
  });

export const findLatestFailureByProject = async (projectId: string) => {
  const [publication] = await db
    .select({
      buildId: gitStatusPublications.buildId,
      state: gitStatusPublications.state,
      httpStatus: gitStatusPublications.httpStatus,
      error: gitStatusPublications.error,
      createdAt: gitStatusPublications.createdAt,
    })
    .from(gitStatusPublications)
    .innerJoin(builds, eq(gitStatusPublications.buildId, builds.id))
    .where(and(eq(builds.projectId, projectId), eq(gitStatusPublications.outcome, "error")))
    .orderBy(desc(gitStatusPublications.createdAt))
    .limit(1);
  return publication ?? null;
};

export type GitStatusPublicationDbSchema = NonNullable<
  Awaited<ReturnType<typeof findLatestByBuild>>
>;
