"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type {
  GitCredentialTypeSchema,
  GitIntegrationSchema,
} from "@ovr/api/contracts/gitIntegrations";
import type { GitProviderSummarySchema } from "@ovr/api/contracts/gitProviders";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { FieldError, FieldGroup } from "@ovr/ui/components/field";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { AccessTokenFields } from "./AccessTokenFields";
import { ConnectionRepositoryField } from "./ConnectionRepositoryField";
import { CredentialTypeField } from "./CredentialTypeField";
import { GitIntegrationActions } from "./GitIntegrationActions";
import { ProviderField } from "./ProviderField";
import {
  defaultFormValues,
  makeGitIntegrationFormSchema,
  toCredentialInput,
  type GitIntegrationFormValues,
} from "./schema";

type GitIntegrationFormProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  providers: GitProviderSummarySchema[];
};

// A project keeps showing the credential type it already uses, even after the instance
// stops offering it, so an admin can see what it uses and switch away.
const availableCredentialTypes = (
  provider: GitProviderSummarySchema,
  integration: GitIntegrationSchema | null,
): GitCredentialTypeSchema[] =>
  integration?.provider === provider.id &&
  !provider.credentialTypes.includes(integration.credentialType)
    ? [...provider.credentialTypes, integration.credentialType]
    : provider.credentialTypes;

export const GitIntegrationForm = ({
  projectId,
  integration,
  providers,
}: GitIntegrationFormProps) => {
  const router = useRouter();
  const hasStoredToken = integration?.credentialType === "access_token";

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GitIntegrationFormValues>({
    resolver: zodResolver(makeGitIntegrationFormSchema(hasStoredToken)),
    defaultValues: defaultFormValues(integration, providers),
  });

  const provider = providers.find(({ id }) => id === watch("provider")) ?? providers[0];
  const credentialType = watch("credentialType");

  const save = useServerAction(serverClient.gitIntegrations.upsert, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration saved");
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  if (!provider) {
    return null;
  }

  const credentialTypes = availableCredentialTypes(provider, integration);

  const handleFormSubmit = (values: GitIntegrationFormValues) => {
    save.execute({ projectId, provider: values.provider, credential: toCredentialInput(values) });
  };

  const handleProviderChange = (next: GitProviderSummarySchema) => {
    setValue("repository", null);
    if (!next.credentialTypes.includes(credentialType)) {
      setValue("credentialType", next.credentialTypes[0]!);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="@container">
        <CardContent className="flex flex-col gap-5">
          <FieldGroup>
            <ProviderField
              control={control}
              providers={providers}
              onChange={handleProviderChange}
            />
          </FieldGroup>
          {credentialTypes.length > 1 ? (
            <FieldGroup>
              <CredentialTypeField
                control={control}
                provider={provider}
                credentialTypes={credentialTypes}
              />
            </FieldGroup>
          ) : null}
          {credentialType === "connection" ? (
            <FieldGroup>
              <ConnectionRepositoryField
                control={control}
                provider={provider}
                error={errors.repository}
              />
            </FieldGroup>
          ) : (
            <AccessTokenFields
              register={register}
              errors={errors}
              provider={provider}
              hasStoredToken={hasStoredToken}
            />
          )}
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 @md:flex-row @md:items-center @md:justify-between">
          <GitIntegrationActions
            projectId={projectId}
            integration={integration}
            isSaving={save.status === "pending"}
          />
        </CardFooter>
      </Card>
    </form>
  );
};
