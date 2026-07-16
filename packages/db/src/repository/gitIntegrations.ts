import { eq } from "drizzle-orm";

import { db } from "../db";
import { gitIntegrations } from "../schema";

export const findByProject = (projectId: string) =>
  db.query.gitIntegrations.findFirst({
    where: (gitIntegrations, { eq }) => eq(gitIntegrations.projectId, projectId),
  });

type UpsertInput = {
  projectId: string;
  provider: typeof gitIntegrations.$inferInsert.provider;
  baseUrl: string | null;
  repoIdentifier: string;
  encryptedToken: string;
  checkContext?: string;
};

export const upsert = async (values: UpsertInput) => {
  const [integration] = await db
    .insert(gitIntegrations)
    .values(values)
    .onConflictDoUpdate({
      target: gitIntegrations.projectId,
      set: {
        provider: values.provider,
        baseUrl: values.baseUrl,
        repoIdentifier: values.repoIdentifier,
        encryptedToken: values.encryptedToken,
        checkContext: values.checkContext,
      },
    })
    .returning();
  return integration;
};

type UpdateFieldsInput = {
  projectId: string;
  provider: typeof gitIntegrations.$inferInsert.provider;
  baseUrl: string | null;
  repoIdentifier: string;
  checkContext?: string;
};

export const updateFields = async (values: UpdateFieldsInput) => {
  const [integration] = await db
    .update(gitIntegrations)
    .set({
      provider: values.provider,
      baseUrl: values.baseUrl,
      repoIdentifier: values.repoIdentifier,
      checkContext: values.checkContext,
    })
    .where(eq(gitIntegrations.projectId, values.projectId))
    .returning();
  return integration;
};

export const remove = async (projectId: string) => {
  await db.delete(gitIntegrations).where(eq(gitIntegrations.projectId, projectId));
};

export type GitIntegrationDbSchema = NonNullable<Awaited<ReturnType<typeof findByProject>>>;
