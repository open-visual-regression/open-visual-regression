import { oc } from "@orpc/contract";
import { z } from "zod";

export const gitProviderSchema = z.enum(["github"]);

export type GitProviderSchema = z.infer<typeof gitProviderSchema>;

export const gitAuthTypeSchema = z.enum(["access_token", "github_app"]);

export type GitAuthTypeSchema = z.infer<typeof gitAuthTypeSchema>;

/** How each provider can authenticate, in the order the form offers them. */
export const GIT_PROVIDER_AUTH_TYPES = {
  github: ["github_app", "access_token"],
} as const satisfies Record<GitProviderSchema, readonly GitAuthTypeSchema[]>;

export const supportsAuthType = (provider: GitProviderSchema, authType: GitAuthTypeSchema) =>
  (GIT_PROVIDER_AUTH_TYPES[provider] as readonly GitAuthTypeSchema[]).includes(authType);

export const gitIntegrationSchema = z.object({
  provider: gitProviderSchema,
  repoIdentifier: z.string(),
  checkContext: z.string(),
  statusChecksEnabled: z.boolean(),
  authType: gitAuthTypeSchema,
  githubInstallationId: z.number().int().nullable(),
  externalRepoId: z.number().int().nullable(),
});

export type GitIntegrationSchema = z.infer<typeof gitIntegrationSchema>;

export const getGitIntegrationInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const getGitIntegrationOutputSchema = z.object({
  integration: gitIntegrationSchema.nullable(),
});

export const upsertGitIntegrationInputSchema = z
  .discriminatedUnion("authType", [
    z.object({
      projectId: z.uuidv7(),
      provider: gitProviderSchema,
      authType: z.literal("access_token"),
      repoIdentifier: z.string().min(1).max(512),
      token: z.string().min(1).optional(),
    }),
    z.object({
      projectId: z.uuidv7(),
      provider: gitProviderSchema,
      authType: z.literal("github_app"),
      installationId: z.number().int().positive(),
      repositoryId: z.number().int().positive(),
    }),
  ])
  .refine((input) => supportsAuthType(input.provider, input.authType), {
    error: "the provider does not support this authentication",
    path: ["authType"],
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
