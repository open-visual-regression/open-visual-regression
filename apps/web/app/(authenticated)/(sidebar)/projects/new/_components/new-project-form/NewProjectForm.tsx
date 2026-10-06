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
    .min(1, "you must enter a project name")
    .max(255, "the project name must be less than 255 characters"),
  projectDescription: z
    .string()
    .max(511, "the project description must be less than 511 characters"),
  gitMainBranch: z
    .string()
    .min(1, "you must enter a baseline git branch")
    .max(255, "the baseline git branch must be less than 255 characters"),
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

/**
 * @todo
 * 1. Update the field label so it matches the mockups
 * 2. Add a field description for git main branch
 * 3. Trigger a server action if the form is submitted and valid
 * 4. Render the loading button if the form is submitting.
 * 5. Allow users to specify screenshot resolutions/browsers, as per the mockups.
 */
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
            <FieldLabel>name</FieldLabel>
            <Input
              id="name"
              placeholder="enter the project name"
              aria-invalid={!!errors.projectName}
              {...register("projectName")}
            />
            <FieldError errors={[errors.projectName]} />
          </Field>
        }
        description={
          <Field data-invalid={!!errors.projectDescription}>
            <FieldLabel>description</FieldLabel>
            <Textarea
              id="description"
              placeholder="enter the project description"
              aria-invalid={!!errors.projectDescription}
              {...register("projectDescription")}
            />
            <FieldError errors={[errors.projectDescription]} />
          </Field>
        }
        gitMainBranch={
          <Field data-invalid={!!errors.gitMainBranch}>
            <FieldLabel>git main branch</FieldLabel>
            <Input
              id="gitMainBranch"
              placeholder="enter the baseline git branch"
              aria-invalid={!!errors.gitMainBranch}
              {...register("gitMainBranch")}
            />
            <FieldError errors={[errors.gitMainBranch]} />
          </Field>
        }
        actions={
          <>
            <ButtonLink href="/projects" size="lg" variant="outline" color="neutral">
              cancel
            </ButtonLink>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Icon icon={PlusIcon} />
              {isSubmitting ? "creating..." : "create project"}
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
    <Typography variant="label">general</Typography>
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
      name={<FieldSkeleton label="name" />}
      description={<FieldSkeleton label="description" className="h-16" />}
      gitMainBranch={<FieldSkeleton label="git main branch" />}
      actions={
        <>
          <ButtonSkeleton size="lg">cancel</ButtonSkeleton>
          <ButtonSkeleton size="lg">
            <Icon icon={PlusIcon} />
            create project
          </ButtonSkeleton>
        </>
      }
    />
  </div>
);
