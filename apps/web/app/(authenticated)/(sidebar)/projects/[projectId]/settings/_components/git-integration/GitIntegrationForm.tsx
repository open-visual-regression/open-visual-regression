"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { GithubAppRepositoriesSchema } from "@ovr/api/contracts/githubApp";
import {
  GIT_PROVIDER_AUTH_TYPES,
  type GitAuthTypeSchema,
  type GitIntegrationSchema,
  type GitProviderSchema,
} from "@ovr/api/contracts/gitIntegrations";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSkeleton,
} from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { toast } from "@ovr/ui/components/toast";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { serverClient } from "@/lib/router";

import { StatusChecksToggleButton } from "./StatusChecksToggleButton";

const PROVIDERS: { value: GitProviderSchema; label: string }[] = [
  { value: "github", label: "github" },
];

const AUTH_TYPE_LABELS: Record<GitAuthTypeSchema, string> = {
  github_app: "github app",
  access_token: "access token",
};

const repositoryValue = (installationId: number, repositoryId: number) =>
  `${installationId}:${repositoryId}`;

const parseRepositoryValue = (value: string) => {
  const [installationId, repositoryId] = value.split(":").map(Number);
  return { installationId: installationId!, repositoryId: repositoryId! };
};

const makeGitIntegrationSchema = (hasStoredToken: boolean) =>
  z
    .object({
      provider: z.enum(["github"]),
      authType: z.enum(["access_token", "github_app"]),
      repoIdentifier: z.string().max(512),
      token: z.string().max(512),
      repository: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.authType === "github_app") {
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

type GitIntegrationFormValues = z.infer<ReturnType<typeof makeGitIntegrationSchema>>;

type GitIntegrationFormProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  githubApp: GithubAppRepositoriesSchema;
};

export const GitIntegrationForm = ({
  projectId,
  integration,
  githubApp,
}: GitIntegrationFormProps) => {
  const router = useRouter();
  const hasStoredToken = integration?.authType === "access_token";
  const appRepositories = githubApp.status === "ok" ? githubApp.repositories : [];
  const offerGithubApp =
    integration?.authType === "github_app" ||
    githubApp.status === "error" ||
    appRepositories.length > 0;

  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors },
  } = useForm<GitIntegrationFormValues>({
    resolver: zodResolver(makeGitIntegrationSchema(hasStoredToken)),
    defaultValues: {
      provider: integration?.provider ?? "github",
      authType: integration?.authType ?? (offerGithubApp ? "github_app" : "access_token"),
      repoIdentifier: integration?.authType === "access_token" ? integration.repoIdentifier : "",
      token: "",
      repository:
        integration?.authType === "github_app" &&
        integration.githubInstallationId !== null &&
        integration.externalRepoId !== null
          ? repositoryValue(integration.githubInstallationId, integration.externalRepoId)
          : "",
    },
  });

  const provider = watch("provider");
  const authType = watch("authType");
  const authTypes = GIT_PROVIDER_AUTH_TYPES[provider].filter(
    (type) => type !== "github_app" || offerGithubApp,
  );
  const repositoryItems = appRepositories.map((repository) => ({
    value: repositoryValue(repository.installationId, repository.id),
    label: repository.fullName,
  }));

  const save = useServerAction(serverClient.gitIntegrations.upsert, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration saved");
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const test = useServerAction(serverClient.gitIntegrations.testConnection, {
    interceptors: [
      onSuccess((result) => {
        if (result.ok) {
          toast.success("connection ok");
        } else {
          toast.error(result.error ?? "connection failed");
        }
      }),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const disconnect = useServerAction(serverClient.gitIntegrations.remove, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration removed");
        router.refresh();
      }),
    ],
  });

  const handleFormSubmit = (values: GitIntegrationFormValues) => {
    if (values.authType === "github_app") {
      save.execute({
        projectId,
        provider: values.provider,
        authType: "github_app",
        ...parseRepositoryValue(values.repository),
      });
      return;
    }

    save.execute({
      projectId,
      provider: values.provider,
      authType: "access_token",
      repoIdentifier: values.repoIdentifier,
      token: values.token.trim() === "" ? undefined : values.token,
    });
  };

  const isSaving = save.status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="@container">
        <CardContent className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={!!errors.provider}>
              <FieldLabel htmlFor="provider">provider</FieldLabel>
              <Controller
                control={control}
                name="provider"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="provider" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.provider]} />
            </Field>
          </FieldGroup>
          {authTypes.length > 1 ? (
            <FieldGroup>
              <Field data-invalid={!!errors.authType}>
                <FieldLabel htmlFor="authType">authentication</FieldLabel>
                <Controller
                  control={control}
                  name="authType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={AUTH_TYPE_LABELS}
                    >
                      <SelectTrigger id="authType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {authTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {AUTH_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
          ) : null}
          {authType === "github_app" ? (
            <FieldGroup>
              <Field data-invalid={!!errors.repository}>
                <FieldLabel htmlFor="repository">repository</FieldLabel>
                <Controller
                  control={control}
                  name="repository"
                  render={({ field }) => (
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                      items={repositoryItems}
                    >
                      <SelectTrigger
                        id="repository"
                        className="w-full"
                        aria-invalid={!!errors.repository}
                      >
                        <SelectValue placeholder="choose a repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {repositoryItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  {githubApp.status === "error"
                    ? `couldn't load the github app's repositories: ${githubApp.error}`
                    : "only repositories the github app is installed on are listed."}{" "}
                  <ButtonLink href="/settings/integrations" variant="link" color="neutral">
                    check the installations
                  </ButtonLink>
                </FieldDescription>
                <FieldError errors={[errors.repository]} />
              </Field>
            </FieldGroup>
          ) : (
            <>
              <FieldGroup>
                <Field data-invalid={!!errors.repoIdentifier}>
                  <FieldLabel htmlFor="repoIdentifier">repository</FieldLabel>
                  <Input
                    id="repoIdentifier"
                    placeholder="owner/repo"
                    aria-invalid={!!errors.repoIdentifier}
                    {...register("repoIdentifier")}
                  />
                  <FieldError errors={[errors.repoIdentifier]} />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field data-invalid={!!errors.token}>
                  <FieldLabel htmlFor="token">access token</FieldLabel>
                  <Input
                    id="token"
                    type="password"
                    autoComplete="off"
                    placeholder={
                      hasStoredToken ? "re-enter to update the stored token" : "paste a token"
                    }
                    aria-invalid={!!errors.token}
                    {...register("token")}
                  />
                  <FieldError errors={[errors.token]} />
                </Field>
              </FieldGroup>
            </>
          )}
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 @md:flex-row @md:items-center @md:justify-between">
          {integration ? (
            <div className="flex flex-col gap-2 @md:flex-row">
              <Button
                type="button"
                variant="outline"
                color="red"
                disabled={disconnect.status === "pending"}
                onClick={() => disconnect.execute({ projectId })}
                className="w-full @md:w-auto"
              >
                disconnect
              </Button>
              <StatusChecksToggleButton
                projectId={projectId}
                enabled={integration.statusChecksEnabled}
                className="w-full @md:w-auto"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 @md:ml-auto @md:flex-row">
            {integration ? (
              <Button
                type="button"
                variant="outline"
                disabled={test.status === "pending"}
                onClick={() => test.execute({ projectId })}
                className="w-full @md:w-auto"
              >
                {test.status === "pending" ? "testing..." : "test connection"}
              </Button>
            ) : null}
            <Button type="submit" disabled={isSaving} className="w-full @md:w-auto">
              <Icon icon={CheckIcon} />
              {isSaving ? "saving..." : "save"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export const GitIntegrationFormSkeleton = () => (
  <Card size="default" aria-hidden>
    <CardContent className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-16 rounded-lg" />
    </CardFooter>
  </Card>
);
