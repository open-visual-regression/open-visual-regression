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

import { updateAccountFormSchema, type UpdateAccountFormValues } from "./schema";

export type UpdateAccountFormProps = {
  user: {
    name: string;
    email: string;
  };
  readOnly?: boolean;
};

export const UpdateAccountForm = ({ user, readOnly = false }: UpdateAccountFormProps) => {
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
      <UpdateAccountFormLayout
        name={
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">name</FieldLabel>
            <Input
              id="name"
              placeholder="enter your name"
              readOnly={readOnly}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
        }
        email={
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="enter your email"
              readOnly={readOnly}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        }
        footnote={
          <>
            <FieldError errors={[errors.root]} />
            {readOnly && (
              <Typography variant="body-muted" as="p">
                your name and email are managed by your identity provider
              </Typography>
            )}
          </>
        }
        action={
          readOnly ? null : (
            <Button type="submit" disabled={isSubmitting}>
              <Icon icon={CheckIcon} />
              {isSubmitting ? "saving..." : "save changes"}
            </Button>
          )
        }
      />
    </form>
  );
};

type UpdateAccountFormLayoutProps = {
  name: React.ReactNode;
  email: React.ReactNode;
  footnote?: React.ReactNode;
  // Left out when the account is read-only, which drops the footer.
  action: React.ReactNode;
};

const UpdateAccountFormLayout = ({
  name,
  email,
  footnote,
  action,
}: UpdateAccountFormLayoutProps) => (
  <div className="flex flex-col gap-2">
    <Typography variant="label">general</Typography>
    <Card size="default">
      <CardContent className="flex flex-col gap-5">
        <FieldGroup>{name}</FieldGroup>
        <FieldGroup>{email}</FieldGroup>
        {footnote}
      </CardContent>
      {action && <CardFooter className="flex flex-row justify-end">{action}</CardFooter>}
    </Card>
  </div>
);

export const UpdateAccountFormSkeleton = () => (
  <div aria-hidden>
    <UpdateAccountFormLayout
      name={<FieldSkeleton label="name" />}
      email={<FieldSkeleton label="email" />}
      action={
        <ButtonSkeleton>
          <Icon icon={CheckIcon} />
          save changes
        </ButtonSkeleton>
      }
    />
  </div>
);
