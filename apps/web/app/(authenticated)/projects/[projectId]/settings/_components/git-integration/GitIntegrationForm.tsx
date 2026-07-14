"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { GitIntegrationSchema, GitProviderSchema } from "@ovr/api/contracts/gitIntegrations";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

const PROVIDERS: { value: GitProviderSchema; label: string }[] = [
  { value: "github", label: "github" },
  { value: "gitea", label: "gitea" },
];

const SELF_HOSTED: GitProviderSchema[] = ["gitea"];

const gitIntegrationSchema = z
  .object({
    provider: z.enum(["github", "gitea"]),
    baseUrl: z.string().max(512),
    repoIdentifier: z.string().min(1, "you must enter a repository").max(512),
    token: z.string().min(1, "you must enter an access token"),
  })
  .superRefine((values, ctx) => {
    if (SELF_HOSTED.includes(values.provider) && values.baseUrl.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["baseUrl"],
        message: "a base url is required for self-hosted providers",
      });
    }
  });

type GitIntegrationFormValues = z.infer<typeof gitIntegrationSchema>;

type GitIntegrationFormProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
};

export const GitIntegrationForm = ({ projectId, integration }: GitIntegrationFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<GitIntegrationFormValues>({
    resolver: zodResolver(gitIntegrationSchema),
    defaultValues: {
      provider: integration?.provider ?? "github",
      baseUrl: integration?.baseUrl ?? "",
      repoIdentifier: integration?.repoIdentifier ?? "",
      token: "",
    },
  });

  const save = useServerAction(serverClient.gitIntegrations.upsert, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration saved");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const disconnect = useServerAction(serverClient.gitIntegrations.remove, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration removed");
      }),
    ],
  });

  const handleFormSubmit = (values: GitIntegrationFormValues) => {
    save.execute({
      projectId,
      provider: values.provider,
      baseUrl: values.baseUrl.trim() === "" ? null : values.baseUrl.trim(),
      repoIdentifier: values.repoIdentifier,
      token: values.token,
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup>
              <Field data-invalid={!!errors.baseUrl}>
                <FieldLabel htmlFor="baseUrl">base url</FieldLabel>
                <Input
                  id="baseUrl"
                  placeholder="https://git.example.com"
                  aria-invalid={!!errors.baseUrl}
                  {...register("baseUrl")}
                />
                <FieldError errors={[errors.baseUrl]} />
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
          </div>
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
        <CardFooter className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            {integration ? (
              <Button
                type="button"
                variant="outline"
                color="red"
                disabled={disconnect.status === "pending"}
                onClick={() => disconnect.execute({ projectId })}
              >
                disconnect
              </Button>
            ) : null}
          </div>
          <Button type="submit" disabled={isSaving}>
            <Icon icon={CheckIcon} />
            {isSaving ? "saving..." : "save"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
