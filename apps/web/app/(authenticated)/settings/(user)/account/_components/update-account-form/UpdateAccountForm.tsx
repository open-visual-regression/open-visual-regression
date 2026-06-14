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
import { updateAccountFormSchema, type UpdateAccountFormValues } from "./schema";

export type UpdateAccountFormProps = {
  user: {
    name: string;
    email: string;
  };
};

export const UpdateAccountForm = ({ user }: UpdateAccountFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const { execute, status } = useServerAction(serverClient.account.updateAccountInformation, {
    interceptors: [
      onSuccess(() => {
        toast.success("account updated");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: UpdateAccountFormValues) => {
    execute(values);
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
                  placeholder="enter your name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="enter your email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
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
      </div>
    </form>
  );
};
