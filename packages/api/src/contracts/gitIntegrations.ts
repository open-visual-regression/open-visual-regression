import { oc } from "@orpc/contract";
import { z } from "zod";

export const gitProviderSchema = z.enum(["github"]);

export type GitProviderSchema = z.infer<typeof gitProviderSchema>;

export const gitCredentialTypeSchema = z.enum(["access_token", "connection"]);

export type GitCredentialTypeSchema = z.infer<typeof gitCredentialTypeSchema>;

export const gitIntegrationSchema = z.object({
  provider: gitProviderSchema,
  repoIdentifier: z.string(),
  checkContext: z.string(),
  statusChecksEnabled: z.boolean(),
  credentialType: gitCredentialTypeSchema,
  connectionId: z.string().nullable(),
  externalRepoId: z.string().nullable(),
});

export type GitIntegrationSchema = z.infer<typeof gitIntegrationSchema>;

export const getGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getGitIntegrationOutputSchema = z.object({
  integration: gitIntegrationSchema.nullable(),
});

export const gitCredentialInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("access_token"),
    repoIdentifier: z.string().min(1).max(512),
    /** Omit to keep the stored token. */
    token: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("connection"),
    connectionId: z.string().min(1).max(255),
    repositoryId: z.string().min(1).max(255),
  }),
]);

export type GitCredentialInputSchema = z.infer<typeof gitCredentialInputSchema>;

export const upsertGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
  provider: gitProviderSchema,
  credential: gitCredentialInputSchema,
});

export type UpsertGitIntegrationInputSchema = z.infer<typeof upsertGitIntegrationInputSchema>;

export const removeGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const setGitStatusChecksInputSchema = z.object({
  projectId: z.uuidv7(),
  enabled: z.boolean(),
});

export const testGitIntegrationOutputSchema = z.object({
  ok: z.boolean(),
  httpStatus: z.number().int().nullable(),
  error: z.string().nullable(),
});

export const contract = {
  get: oc.input(getGitIntegrationInputSchema).output(getGitIntegrationOutputSchema),
  upsert: oc.input(upsertGitIntegrationInputSchema).output(gitIntegrationSchema),
  setStatusChecks: oc.input(setGitStatusChecksInputSchema).output(gitIntegrationSchema),
  remove: oc.input(removeGitIntegrationInputSchema),
  testConnection: oc.input(removeGitIntegrationInputSchema).output(testGitIntegrationOutputSchema),
} as const;
