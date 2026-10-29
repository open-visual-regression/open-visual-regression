import { oc } from "@orpc/contract";
import { z } from "zod";

import { gitCredentialTypeSchema, gitProviderSchema } from "./gitIntegrations";

export const gitProviderSummarySchema = z.object({
  id: gitProviderSchema,
  name: z.string(),
  repository: z.object({ placeholder: z.string() }),
  /** The credential types a project can use with this provider right now. */
  credentialTypes: z.array(gitCredentialTypeSchema).min(1),
  connections: z
    .object({
      label: z.string(),
      setupGuideUrl: z.string(),
      configured: z.boolean(),
    })
    .nullable(),
});

export type GitProviderSummarySchema = z.infer<typeof gitProviderSummarySchema>;

export const listGitProvidersOutputSchema = z.object({
  providers: z.array(gitProviderSummarySchema),
});

export const gitConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  manageUrl: z.string().nullable(),
  repositoryCount: z.number().int().nullable(),
  warnings: z.array(z.string()),
});

export type GitConnectionSchema = z.infer<typeof gitConnectionSchema>;

export const gitConnectionsStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_configured") }),
  z.object({ status: z.literal("error"), error: z.string() }),
  z.object({
    status: z.literal("ok"),
    name: z.string(),
    description: z.string().nullable(),
    manageUrl: z.string().nullable(),
    addUrl: z.string().nullable(),
    warnings: z.array(z.string()),
    connections: z.array(gitConnectionSchema),
  }),
]);

export type GitConnectionsStatusSchema = z.infer<typeof gitConnectionsStatusSchema>;

export const gitProviderConnectionsSchema = z.object({
  provider: gitProviderSchema,
  providerName: z.string(),
  label: z.string(),
  setupGuideUrl: z.string(),
  status: gitConnectionsStatusSchema,
});

export type GitProviderConnectionsSchema = z.infer<typeof gitProviderConnectionsSchema>;

export const listGitConnectionsOutputSchema = z.object({
  providers: z.array(gitProviderConnectionsSchema),
});

export const gitRepositorySchema = z.object({
  connectionId: z.string(),
  id: z.string(),
  fullName: z.string(),
  private: z.boolean(),
});

export type GitRepositorySchema = z.infer<typeof gitRepositorySchema>;

export const searchGitRepositoriesInputSchema = z.object({
  provider: gitProviderSchema,
  connectionId: z.string().min(1).max(255).optional(),
  query: z.string().max(200).optional(),
  cursor: z.string().max(255).nullable().optional(),
});

export type SearchGitRepositoriesInputSchema = z.infer<typeof searchGitRepositoriesInputSchema>;

export const searchGitRepositoriesOutputSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("error"), error: z.string() }),
  z.object({
    status: z.literal("ok"),
    repositories: z.array(gitRepositorySchema),
    nextCursor: z.string().nullable(),
  }),
]);

export type SearchGitRepositoriesOutputSchema = z.infer<typeof searchGitRepositoriesOutputSchema>;

export const contract = {
  list: oc.output(listGitProvidersOutputSchema),
  connections: oc.output(listGitConnectionsOutputSchema),
  searchRepositories: oc
    .input(searchGitRepositoriesInputSchema)
    .output(searchGitRepositoriesOutputSchema),
} as const;
