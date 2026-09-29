"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { GitIntegrationSchema, GitProviderSchema } from "@ovr/api/contracts/gitIntegrations";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSkeleton } from "@ovr/ui/components/field";
import { CheckIcon, Icon, Trash2Icon } from "@ovr/ui/components/icon";
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

import { serverClient } from "@/lib/router";

import { StatusChecksToggleButton } from "./StatusChecksToggleButton";

const PROVIDERS: { value: GitProviderSchema; label: string }[] = [
  { value: "github", label: "github" },
];

const makeGitIntegrationSchema = (isEditing: boolean) =>
  z.object({
    provider: z.enum(["github"]),
    repoIdentifier: z.string().min(1, "you must enter a repository").max(512),
    token: isEditing
      ? z.string().max(512)
      : z.string().min(1, "you must enter an access token").max(512),
  });

type GitIntegrationFormValues = z.infer<ReturnType<typeof makeGitIntegrationSchema>>;

type GitIntegrationFormProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
};

export const GitIntegrationForm = ({ projectId, integration }: GitIntegrationFormProps) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<GitIntegrationFormValues>({
    resolver: zodResolver(makeGitIntegrationSchema(!!integration)),
    defaultValues: {
      provider: integration?.provider ?? "github",
      repoIdentifier: integration?.repoIdentifier ?? "",
      token: "",
    },
  });

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
    save.execute({
      projectId,
      provider: values.provider,
      repoIdentifier: values.repoIdentifier,
      token: values.token.trim() === "" ? undefined : values.token,
    });
  };

  const isSaving = save.status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default">
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
                placeholder={integration ? "re-enter to update the stored token" : "paste a token"}
                aria-invalid={!!errors.token}
                {...register("token")}
              />
              <FieldError errors={[errors.token]} />
            </Field>
          </FieldGroup>
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between md:max-xl:flex-col md:max-xl:items-stretch">
          <div className="flex flex-col gap-2 sm:flex-row md:max-xl:*:flex-auto md:max-xl:*:px-2">
            {integration ? (
              <Button
                type="button"
                variant="outline"
                color="red"
                disabled={disconnect.status === "pending"}
                onClick={() => disconnect.execute({ projectId })}
                className="w-full sm:w-auto"
              >
                <Icon icon={Trash2Icon} className="md:max-xl:hidden" />
                disconnect
              </Button>
            ) : null}
            {integration ? (
              <StatusChecksToggleButton
                projectId={projectId}
                enabled={integration.statusChecksEnabled}
                className="w-full sm:w-auto"
              />
            ) : null}
            {integration ? (
              <Button
                type="button"
                variant="outline"
                disabled={test.status === "pending"}
                onClick={() => test.execute({ projectId })}
                className="w-full sm:w-auto"
              >
                {test.status === "pending" ? "testing..." : "test connection"}
              </Button>
            ) : null}
          </div>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto md:max-xl:self-end">
            <Icon icon={CheckIcon} />
            {isSaving ? "saving..." : "save"}
          </Button>
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
