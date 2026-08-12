"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useForm } from "react-hook-form";

import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSkeleton } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { updateOrganizationFormSchema, type UpdateOrganizationFormValues } from "./schema";

export type UpdateOrganizationFormProps = {
  organization: {
    name: string;
  };
};

export const UpdateOrganizationForm = ({ organization }: UpdateOrganizationFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationFormSchema),
  });

  const { execute, status } = useServerAction(serverClient.organizations.update, {
    interceptors: [
      onSuccess(() => {
        toast.success("organization updated");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: UpdateOrganizationFormValues) => {
    execute(values);
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">name</FieldLabel>
              <Input
                id="name"
                placeholder="enter the organization name"
                aria-invalid={!!errors.name}
                defaultValue={organization.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
          </FieldGroup>
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-row justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Icon icon={CheckIcon} />
            {isSubmitting ? "saving..." : "save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export const UpdateOrganizationFormSkeleton = () => (
  <Card size="default" aria-hidden className="w-full md:w-2/3 lg:w-1/2">
    <CardContent className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
