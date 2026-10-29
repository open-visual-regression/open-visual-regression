import { z } from "zod";

import {
  gitCredentialTypeSchema,
  gitProviderSchema,
  type GitCredentialInputSchema,
  type GitIntegrationSchema,
} from "@ovr/api/contracts/gitIntegrations";
import {
  gitRepositorySchema,
  type GitProviderSummarySchema,
} from "@ovr/api/contracts/gitProviders";

export const makeGitIntegrationFormSchema = (hasStoredToken: boolean) =>
  z
    .object({
      provider: gitProviderSchema,
      credentialType: gitCredentialTypeSchema,
      repoIdentifier: z.string().max(512),
      token: z.string().max(512),
      repository: gitRepositorySchema.nullable(),
    })
    .superRefine((values, ctx) => {
      if (values.credentialType === "connection") {
        if (!values.repository) {
          ctx.addIssue({
            code: "custom",
            path: ["repository"],
            message: "you must choose a repository",
          });
        }
        return;
      }

      if (!values.repoIdentifier.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["repoIdentifier"],
          message: "you must enter a repository",
        });
      }
      if (!hasStoredToken && !values.token.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["token"],
          message: "you must enter an access token",
        });
      }
    });

export type GitIntegrationFormValues = z.infer<ReturnType<typeof makeGitIntegrationFormSchema>>;

export const defaultFormValues = (
  integration: GitIntegrationSchema | null,
  providers: GitProviderSummarySchema[],
): GitIntegrationFormValues => {
  const provider = providers.find(({ id }) => id === integration?.provider) ?? providers[0];

  return {
    provider: provider?.id ?? "github",
    credentialType: integration?.credentialType ?? provider?.credentialTypes[0] ?? "access_token",
    repoIdentifier:
      integration?.credentialType === "access_token" ? integration.repoIdentifier : "",
    token: "",
    repository:
      integration?.credentialType === "connection" &&
      integration.connectionId !== null &&
      integration.externalRepoId !== null
        ? {
            connectionId: integration.connectionId,
            id: integration.externalRepoId,
            fullName: integration.repoIdentifier,
            private: false,
          }
        : null,
  };
};

export const toCredentialInput = (values: GitIntegrationFormValues): GitCredentialInputSchema =>
  values.credentialType === "connection" && values.repository
    ? {
        type: "connection",
        connectionId: values.repository.connectionId,
        repositoryId: values.repository.id,
      }
    : {
        type: "access_token",
        repoIdentifier: values.repoIdentifier,
        token: values.token.trim() === "" ? undefined : values.token,
      };
