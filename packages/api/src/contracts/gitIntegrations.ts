import { oc } from "@orpc/contract";
import { z } from "zod";

export const gitProviderSchema = z.enum(["github"]);

export type GitProviderSchema = z.infer<typeof gitProviderSchema>;

export const gitAuthTypeSchema = z.enum(["token", "github_app"]);

export type GitAuthTypeSchema = z.infer<typeof gitAuthTypeSchema>;

export const gitIntegrationSchema = z.object({
  provider: gitProviderSchema,
  repoIdentifier: z.string(),
  checkContext: z.string(),
  statusChecksEnabled: z.boolean(),
  authType: gitAuthTypeSchema,
  hasToken: z.boolean(),
});

export type GitIntegrationSchema = z.infer<typeof gitIntegrationSchema>;

export const getGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getGitIntegrationOutputSchema = z.object({
  integration: gitIntegrationSchema.nullable(),
  // The auth types this deployment can offer, by provider.
  availableAuthTypes: z.record(gitProviderSchema, z.array(gitAuthTypeSchema)),
});

export const upsertGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
  provider: gitProviderSchema,
  repoIdentifier: z.string().min(1).max(512),
  authType: gitAuthTypeSchema.default("token"),
  token: z.string().min(1).optional(),
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
