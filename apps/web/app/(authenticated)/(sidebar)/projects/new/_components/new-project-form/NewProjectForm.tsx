"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, ButtonSkeleton } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSkeleton } from "@ovr/ui/components/field";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Textarea } from "@ovr/ui/components/textarea";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { serverClient } from "@/lib/router";

const newProjectSchema = z.object({
  projectName: z
    .string()
    .min(1, "You must enter a project name")
    .max(255, "The project name must be less than 255 characters"),
  projectDescription: z
    .string()
    .max(511, "The project description must be less than 511 characters"),
  gitMainBranch: z
    .string()
    .min(1, "You must enter a baseline Git branch")
    .max(255, "The baseline Git branch must be less than 255 characters"),
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

export const NewProjectForm = () => {
  const navigate = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
      gitMainBranch: "main",
    },
  });

  const { execute, status } = useServerAction(serverClient.projects.add, {
    interceptors: [
      onSuccess(() => navigate.push("/projects")),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: NewProjectFormValues) => {
    execute(values);
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <NewProjectFormLayout
        name={
          <Field data-invalid={!!errors.projectName}>
            <FieldLabel>Name</FieldLabel>
            <Input
              id="name"
              placeholder="Enter the project name"
              aria-invalid={!!errors.projectName}
              {...register("projectName")}
            />
            <FieldError errors={[errors.projectName]} />
          </Field>
        }
        description={
          <Field data-invalid={!!errors.projectDescription}>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Enter the project description"
              aria-invalid={!!errors.projectDescription}
              {...register("projectDescription")}
            />
            <FieldError errors={[errors.projectDescription]} />
          </Field>
        }
        gitMainBranch={
          <Field data-invalid={!!errors.gitMainBranch}>
            <FieldLabel>Git main branch</FieldLabel>
            <Input
              id="gitMainBranch"
              placeholder="Enter the baseline Git branch"
              aria-invalid={!!errors.gitMainBranch}
              {...register("gitMainBranch")}
            />
            <FieldError errors={[errors.gitMainBranch]} />
          </Field>
        }
        actions={
          <>
            <ButtonLink href="/projects" size="lg" variant="outline" color="neutral">
              Cancel
            </ButtonLink>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Icon icon={PlusIcon} />
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
          </>
        }
      />
    </form>
  );
};

type NewProjectFormLayoutProps = {
  name: React.ReactNode;
  description: React.ReactNode;
  gitMainBranch: React.ReactNode;
  actions: React.ReactNode;
};

const NewProjectFormLayout = ({
  name,
  description,
  gitMainBranch,
  actions,
}: NewProjectFormLayoutProps) => (
  <div className="flex flex-col gap-2">
    <Typography variant="label">General</Typography>
    <Card size="default">
      <CardContent className="flex flex-col gap-5">
        <FieldGroup>{name}</FieldGroup>
        <FieldGroup>{description}</FieldGroup>
        <FieldGroup>{gitMainBranch}</FieldGroup>
      </CardContent>
      <CardFooter className="flex flex-row gap-3 justify-between">{actions}</CardFooter>
    </Card>
  </div>
);

export const NewProjectFormSkeleton = () => (
  <div aria-hidden>
    <NewProjectFormLayout
      name={<FieldSkeleton label="Name" />}
      description={<FieldSkeleton label="Description" className="h-16" />}
      gitMainBranch={<FieldSkeleton label="Git main branch" />}
      actions={
        <>
          <ButtonSkeleton size="lg">Cancel</ButtonSkeleton>
          <ButtonSkeleton size="lg">
            <Icon icon={PlusIcon} />
            Create project
          </ButtonSkeleton>
        </>
      }
    />
  </div>
);
