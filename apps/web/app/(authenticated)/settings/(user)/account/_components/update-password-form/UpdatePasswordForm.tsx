"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useForm } from "react-hook-form";

import { Button, ButtonSkeleton } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSkeleton } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { toast } from "@ovr/ui/components/toast";
import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

import { updatePasswordFormSchema, type UpdatePasswordFormValues } from "./schema";

export const UpdatePasswordForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { execute, status } = useServerAction(serverClient.account.updatePassword, {
    interceptors: [
      onSuccess(() => {
        reset();
        toast.success("password updated");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: UpdatePasswordFormValues) => {
    execute({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <UpdatePasswordFormLayout
        currentPassword={
          <Field data-invalid={!!errors.currentPassword}>
            <FieldLabel htmlFor="currentPassword">current password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="enter your current password"
              aria-invalid={!!errors.currentPassword}
              {...register("currentPassword")}
            />
            <FieldError errors={[errors.currentPassword]} />
          </Field>
        }
        newPassword={
          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel htmlFor="newPassword">new password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="enter a new password"
              aria-invalid={!!errors.newPassword}
              {...register("newPassword")}
            />
            <FieldError errors={[errors.newPassword]} />
          </Field>
        }
        confirmPassword={
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="confirm your new password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
        }
        error={<FieldError errors={[errors.root]} />}
        action={
          <Button type="submit" disabled={isSubmitting}>
            <Icon icon={CheckIcon} />
            {isSubmitting ? "saving..." : "save changes"}
          </Button>
        }
      />
    </form>
  );
};

type UpdatePasswordFormLayoutProps = {
  currentPassword: React.ReactNode;
  newPassword: React.ReactNode;
  confirmPassword: React.ReactNode;
  error?: React.ReactNode;
  action: React.ReactNode;
};

const UpdatePasswordFormLayout = ({
  currentPassword,
  newPassword,
  confirmPassword,
  error,
  action,
}: UpdatePasswordFormLayoutProps) => (
  <div className="flex flex-col gap-2">
    <Typography variant="label">change password</Typography>
    <Card size="default">
      <CardContent className="flex flex-col gap-5">
        <FieldGroup>{currentPassword}</FieldGroup>
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-3">
          <FieldGroup>{newPassword}</FieldGroup>
          <FieldGroup>{confirmPassword}</FieldGroup>
        </div>
        {error}
      </CardContent>
      <CardFooter className="flex flex-row justify-end">{action}</CardFooter>
    </Card>
  </div>
);

export const UpdatePasswordFormSkeleton = () => (
  <div aria-hidden>
    <UpdatePasswordFormLayout
      currentPassword={<FieldSkeleton label="current password" />}
      newPassword={<FieldSkeleton label="new password" />}
      confirmPassword={<FieldSkeleton label="confirm password" />}
      action={
        <ButtonSkeleton>
          <Icon icon={CheckIcon} />
          save changes
        </ButtonSkeleton>
      }
    />
  </div>
);
