"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Textarea } from "@ovr/ui/components/textarea";
import { toast } from "@ovr/ui/components/toast";
import { Typography } from "@ovr/ui/components/typography";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { serverClient } from "@/lib/router";
import type { ProjectDto } from "@ovr/api/contracts/projects";

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter a project name")
    .max(255, "the project name must be less than 255 characters"),
  description: z.string().max(511, "the project description must be less than 511 characters"),
  gitMainBranch: z
    .string()
    .min(1, "you must enter a baseline git branch")
    .max(255, "the baseline git branch must be less than 255 characters"),
  diffThreshold: z
    .number()
    .min(0.01, "the diff threshold must be at least 0.01")
    .max(1, "the diff threshold must be at most 1"),
  retentionDays: z
    .number()
    .int("retention days must be a whole number")
    .min(1, "retention days must be at least 1"),
});

type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

type UpdateProjectFormProps = {
  project: Pick<
    ProjectDto,
    "id" | "name" | "description" | "gitMainBranch" | "diffThreshold" | "retentionDays"
  >;
};

export const UpdateProjectForm = ({ project }: UpdateProjectFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      gitMainBranch: project.gitMainBranch,
      diffThreshold: project.diffThreshold,
      retentionDays: project.retentionDays,
    },
  });

  const { execute, status } = useServerAction(serverClient.projects.update, {
    interceptors: [
      onSuccess(() => {
        toast.success("settings saved");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: UpdateProjectFormValues) => {
    execute({ id: project.id, patch: values });
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="flex flex-col gap-2">
        <Typography variant="label">general</Typography>
        <Card size="default">
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">name</FieldLabel>
                <Input
                  id="name"
                  placeholder="enter the project name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="enter the project description"
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                <FieldError errors={[errors.description]} />
              </Field>
            </FieldGroup>
            <div className="flex flex-col gap-3 sm:flex-row">
              <FieldGroup>
                <Field data-invalid={!!errors.gitMainBranch}>
                  <FieldLabel htmlFor="gitMainBranch">git main branch</FieldLabel>
                  <Input
                    id="gitMainBranch"
                    placeholder="main"
                    aria-invalid={!!errors.gitMainBranch}
                    {...register("gitMainBranch")}
                  />
                  <FieldError errors={[errors.gitMainBranch]} />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field data-invalid={!!errors.diffThreshold}>
                  <FieldLabel htmlFor="diffThreshold">diff threshold</FieldLabel>
                  <Input
                    id="diffThreshold"
                    type="number"
                    step="0.01"
                    placeholder="0.05"
                    aria-invalid={!!errors.diffThreshold}
                    {...register("diffThreshold", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.diffThreshold]} />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field data-invalid={!!errors.retentionDays}>
                  <FieldLabel htmlFor="retentionDays">retention days</FieldLabel>
                  <Input
                    id="retentionDays"
                    type="number"
                    step="1"
                    placeholder="90"
                    aria-invalid={!!errors.retentionDays}
                    {...register("retentionDays", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.retentionDays]} />
                </Field>
              </FieldGroup>
            </div>
            <FieldError errors={[errors.root]} />
          </CardContent>
          <CardFooter className="flex flex-row justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Icon icon={CheckIcon} />
              {isSubmitting ? "saving..." : "save changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};
