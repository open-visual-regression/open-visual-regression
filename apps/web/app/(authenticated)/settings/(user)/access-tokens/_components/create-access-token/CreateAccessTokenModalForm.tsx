"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ACCESS_TOKEN_NAME_MAX_LENGTH } from "@ovr/api/contracts/accessTokens";
import { Button } from "@ovr/ui/components/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ovr/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { serverClient } from "@/lib/router";

import { CreateAccessTokenModalReveal } from "./CreateAccessTokenModalReveal";

const createAccessTokenFormSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter a name")
    .max(
      ACCESS_TOKEN_NAME_MAX_LENGTH,
      `the name must be less than ${ACCESS_TOKEN_NAME_MAX_LENGTH} characters`,
    ),
});

type CreateAccessTokenFormValues = z.infer<typeof createAccessTokenFormSchema>;

export const CreateAccessTokenModalForm = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateAccessTokenFormValues>({
    resolver: zodResolver(createAccessTokenFormSchema),
    defaultValues: { name: "" },
  });

  const { execute, status } = useServerAction(serverClient.accessTokens.create, {
    interceptors: [
      onSuccess(({ token }) => setAccessToken(token)),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  if (accessToken) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>access token created</DialogTitle>
        </DialogHeader>
        <CreateAccessTokenModalReveal accessToken={accessToken} />
      </>
    );
  }

  const handleFormSubmit = (values: CreateAccessTokenFormValues) => {
    execute(values);
  };

  const isSubmitting = status === "pending";

  return (
    <>
      <DialogHeader>
        <DialogTitle>new access token</DialogTitle>
        <DialogDescription>used to authenticate ai agents and other tools</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <FieldGroup className="pb-6">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">name</FieldLabel>
            <Input
              id="name"
              placeholder="enter a name for the access token"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldDescription>a label to help identify this access token later</FieldDescription>
            <FieldError errors={[errors.name]} />
          </Field>
          <FieldError errors={[errors.root]} />
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "creating..." : "create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
