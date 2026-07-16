import { oc } from "@orpc/contract";
import { z } from "zod";

export const gitProviderSchema = z.enum(["github", "gitea"]);

export type GitProviderSchema = z.infer<typeof gitProviderSchema>;

export const gitIntegrationSchema = z.object({
  provider: gitProviderSchema,
  baseUrl: z.string().nullable(),
  repoIdentifier: z.string(),
  checkContext: z.string(),
  hasToken: z.literal(true),
});

export type GitIntegrationSchema = z.infer<typeof gitIntegrationSchema>;

export const getGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getGitIntegrationOutputSchema = z.object({
  integration: gitIntegrationSchema.nullable(),
});

export const upsertGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
  provider: gitProviderSchema,
  baseUrl: z.url().nullable(),
  repoIdentifier: z.string().min(1).max(512),
  token: z.string().min(1).optional(),
  checkContext: z.string().min(1).max(255).optional(),
});

export type UpsertGitIntegrationInputSchema = z.infer<typeof upsertGitIntegrationInputSchema>;

export const removeGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const testGitIntegrationOutputSchema = z.object({
  ok: z.boolean(),
  httpStatus: z.number().int().nullable(),
  error: z.string().nullable(),
});

export const contract = {
  get: oc.input(getGitIntegrationInputSchema).output(getGitIntegrationOutputSchema),
  upsert: oc.input(upsertGitIntegrationInputSchema).output(gitIntegrationSchema),
  remove: oc.input(removeGitIntegrationInputSchema),
  testConnection: oc.input(removeGitIntegrationInputSchema).output(testGitIntegrationOutputSchema),
} as const;
