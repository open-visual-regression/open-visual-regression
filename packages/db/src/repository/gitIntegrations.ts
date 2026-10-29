import { and, eq } from "drizzle-orm";

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
    credentialType: "access_token" as const,
    encryptedToken: values.encryptedToken,
    connectionId: null,
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

type UpsertConnectionInput = {
  projectId: string;
  provider: typeof gitIntegrations.$inferInsert.provider;
  repoIdentifier: string;
  connectionId: string;
  externalRepoId: string;
  checkContext: string;
};

export const upsertConnection = async (values: UpsertConnectionInput) => {
  const fields = {
    provider: values.provider,
    repoIdentifier: values.repoIdentifier,
    checkContext: values.checkContext,
    credentialType: "connection" as const,
    encryptedToken: null,
    connectionId: values.connectionId,
    externalRepoId: values.externalRepoId,
  };

  const [integration] = await db
    .insert(gitIntegrations)
    .values({ projectId: values.projectId, ...fields })
    .onConflictDoUpdate({ target: gitIntegrations.projectId, set: fields })
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
    .where(
      and(
        eq(gitIntegrations.projectId, values.projectId),
        eq(gitIntegrations.credentialType, "access_token"),
      ),
    )
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
