"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { serverClient } from "@/lib/router";

import {
  createAccountSchema,
  signInSchema,
  type CreateAccountFormValues,
  type SignInFormValues,
} from "./schema";

type InvitationFormProps = {
  invitationId: string;
  email: string;
  hasAccount: boolean;
};

const EmailField = ({ email }: { email: string }) => (
  <Field>
    <FieldLabel htmlFor="email">email</FieldLabel>
    <Input id="email" type="email" value={email} disabled readOnly />
  </Field>
);

const CreateAccountForm = ({ invitationId, email }: Omit<InvitationFormProps, "hasAccount">) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
  });

  const { execute, status } = useServerAction(serverClient.invitations.acceptInvitation, {
    interceptors: [
      onSuccess(() => router.push("/")),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const isPending = status === "pending" || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit((values) =>
        execute({ invitationId, name: values.name, password: values.password }),
      )}
      noValidate
    >
      <FieldGroup>
        <EmailField email={email} />
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">name</FieldLabel>
          <Input
            id="name"
            placeholder="enter your name"
            autoFocus
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="enter your password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="confirm your password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "creating…" : "create account"}
        </Button>
      </FieldGroup>
    </form>
  );
};

const SignInForm = ({ invitationId, email }: Omit<InvitationFormProps, "hasAccount">) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { password: "" },
  });

  const { execute, status } = useServerAction(serverClient.invitations.acceptInvitation, {
    interceptors: [
      onSuccess(() => router.push("/")),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const isPending = status === "pending" || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit((values) => execute({ invitationId, password: values.password }))}
      noValidate
    >
      <FieldGroup>
        <EmailField email={email} />
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="enter your existing password"
            autoFocus
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "joining…" : "sign in and join"}
        </Button>
      </FieldGroup>
    </form>
  );
};

export const InvitationForm = ({ invitationId, email, hasAccount }: InvitationFormProps) =>
  hasAccount ? (
    <SignInForm invitationId={invitationId} email={email} />
  ) : (
    <CreateAccountForm invitationId={invitationId} email={email} />
  );
