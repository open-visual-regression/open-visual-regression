"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { toast } from "@ovr/ui/components/toast";
import { Typography } from "@ovr/ui/components/typography";
import { useForm } from "react-hook-form";
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

  const { execute, status } = useServerAction(serverClient.profile.updatePassword, {
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
      <div className="flex flex-col gap-2">
        <Typography variant="label">change password</Typography>
        <Card size="default">
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
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
            </FieldGroup>
            <div className="flex flex-row gap-3">
              <FieldGroup>
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
              </FieldGroup>
              <FieldGroup>
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
