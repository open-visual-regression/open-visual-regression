import { eq } from "drizzle-orm";

import { db } from "../db";
import { gitIntegrations } from "../schema";

export const findByProject = (projectId: string) =>
  db.query.gitIntegrations.findFirst({
    where: (gitIntegrations, { eq }) => eq(gitIntegrations.projectId, projectId),
  });

type UpsertAccessTokenInput = {
  projectId: string;
  provider: typeof gitIntegrations.$inferInsert.provider;
  repoIdentifier: string;
  encryptedToken: string;
  checkContext: string;
};

export const upsertAccessToken = async (values: UpsertAccessTokenInput) => {
  const credentials = {
    authType: "access_token" as const,
    encryptedToken: values.encryptedToken,
    githubInstallationId: null,
    externalRepoId: null,
  };

  const [integration] = await db
    .insert(gitIntegrations)
    .values({ ...values, ...credentials })
    .onConflictDoUpdate({
      target: gitIntegrations.projectId,
      set: {
        provider: values.provider,
        repoIdentifier: values.repoIdentifier,
        checkContext: values.checkContext,
        ...credentials,
      },
    })
    .returning();
  return integration;
};

type UpdateFieldsInput = {
  projectId: string;
  provider: typeof gitIntegrations.$inferInsert.provider;
  repoIdentifier: string;
  checkContext: string;
};

export const updateFields = async (values: UpdateFieldsInput) => {
  const [integration] = await db
    .update(gitIntegrations)
    .set({
      provider: values.provider,
      repoIdentifier: values.repoIdentifier,
      checkContext: values.checkContext,
    })
    .where(eq(gitIntegrations.projectId, values.projectId))
    .returning();
  return integration;
};

export const setStatusChecksEnabled = async (projectId: string, enabled: boolean) => {
  const [integration] = await db
    .update(gitIntegrations)
    .set({ statusChecksEnabled: enabled })
    .where(eq(gitIntegrations.projectId, projectId))
    .returning();
  return integration;
};

export const remove = async (projectId: string) => {
  await db.delete(gitIntegrations).where(eq(gitIntegrations.projectId, projectId));
};

export type GitIntegrationDbSchema = NonNullable<Awaited<ReturnType<typeof findByProject>>>;
