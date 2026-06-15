"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { serverClient } from "@/lib/router";
import { acceptInvitationSchema, type AcceptInvitationFormValues } from "./schema";

type InvitationFormProps = {
  invitationId: string;
  email: string;
};

export const InvitationForm = ({ invitationId, email }: InvitationFormProps) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
  });

  const { execute, status } = useServerAction(serverClient.invitations.acceptInvitation, {
    interceptors: [
      onSuccess(() => router.push("/projects")),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const onSubmit = (values: AcceptInvitationFormValues) => {
    execute({ invitationId, name: values.name, password: values.password });
  };

  const isPending = status === "pending" || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
          <span className="text-green-600">✓</span>
          <span className="text-foreground">{email}</span>
          <span className="ml-auto text-muted-foreground text-xs">verified</span>
        </div>
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
