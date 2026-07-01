"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@ovr/ui/components/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ovr/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { serverClient } from "@/lib/router";

import { InviteUserModalReveal } from "./InviteUserModalReveal";
import { inviteUserFormSchema, type InviteUserFormValues } from "./schema";

export const InviteUserModalForm = () => {
  const router = useRouter();
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: { email: "" },
  });

  const { execute, status } = useServerAction(serverClient.users.invite, {
    interceptors: [
      onSuccess(({ invitationUrl }) => {
        setInvitationUrl(invitationUrl);
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  if (invitationUrl) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>invitation sent</DialogTitle>
        </DialogHeader>
        <InviteUserModalReveal invitationUrl={invitationUrl} />
      </>
    );
  }

  const handleFormSubmit = (values: InviteUserFormValues) => {
    execute(values);
  };

  const isSubmitting = status === "pending";

  return (
    <>
      <DialogHeader>
        <DialogTitle>invite user</DialogTitle>
        <DialogDescription>send an invitation to join this organization</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <FieldGroup className="pb-6">
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="enter their email address"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <FieldError errors={[errors.root]} />
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "sending..." : "send invite"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
