"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ProjectDto } from "@ovr/api/contracts/projects";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSkeleton } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Textarea } from "@ovr/ui/components/textarea";
import { toast } from "@ovr/ui/components/toast";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

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
  retentionDays: z
    .number()
    .int("retention days must be a whole number")
    .min(1, "retention days must be at least 1"),
  requiredReviewerCount: z
    .number()
    .int("required reviewer count must be a whole number")
    .min(1, "required reviewer count must be at least 1"),
});

type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

type UpdateProjectFormProps = {
  project: Pick<
    ProjectDto,
    "id" | "name" | "description" | "gitMainBranch" | "retentionDays" | "requiredReviewerCount"
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
      retentionDays: project.retentionDays,
      requiredReviewerCount: project.requiredReviewerCount,
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
        <Typography variant="h2">general</Typography>
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
              <FieldGroup>
                <Field data-invalid={!!errors.requiredReviewerCount}>
                  <FieldLabel htmlFor="requiredReviewerCount">required reviewers</FieldLabel>
                  <Input
                    id="requiredReviewerCount"
                    type="number"
                    step="1"
                    placeholder="1"
                    aria-invalid={!!errors.requiredReviewerCount}
                    {...register("requiredReviewerCount", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError errors={[errors.requiredReviewerCount]} />
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

export const UpdateProjectFormSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-2">
    <TypographySkeleton variant="h2" className="w-24" />
    <Card size="default">
      <CardContent className="flex flex-col gap-5">
        <FieldGroup>
          <FieldSkeleton />
        </FieldGroup>
        <FieldGroup>
          <FieldSkeleton className="h-16" />
        </FieldGroup>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FieldGroup>
            <FieldSkeleton />
          </FieldGroup>
          <FieldGroup>
            <FieldSkeleton />
          </FieldGroup>
          <FieldGroup>
            <FieldSkeleton />
          </FieldGroup>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row justify-end">
        <Skeleton className="h-8 w-32 rounded-lg" />
      </CardFooter>
    </Card>
  </div>
);
