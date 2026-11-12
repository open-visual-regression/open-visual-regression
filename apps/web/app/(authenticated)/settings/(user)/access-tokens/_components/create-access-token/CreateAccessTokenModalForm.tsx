"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  ACCESS_TOKEN_NAME_MAX_LENGTH,
  accessTokenPermissionsSchema,
} from "@ovr/api/contracts/accessTokens";
import { Button } from "@ovr/ui/components/button";
import { Checkbox } from "@ovr/ui/components/checkbox";
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
  FieldLegend,
  FieldSet,
} from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { serverClient } from "@/lib/router";

import { OPTIONAL_PERMISSIONS } from "../permissions";
import { CreateAccessTokenModalReveal } from "./CreateAccessTokenModalReveal";

const createAccessTokenFormSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter a name")
    .max(
      ACCESS_TOKEN_NAME_MAX_LENGTH,
      `the name must be less than ${ACCESS_TOKEN_NAME_MAX_LENGTH} characters`,
    ),
  permissions: accessTokenPermissionsSchema,
});

type CreateAccessTokenFormValues = z.infer<typeof createAccessTokenFormSchema>;

export const CreateAccessTokenModalForm = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CreateAccessTokenFormValues>({
    resolver: zodResolver(createAccessTokenFormSchema),
    defaultValues: { name: "", permissions: { builds: [], reviews: [] } },
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
            <FieldError errors={[errors.name]} />
          </Field>
          <FieldSet>
            <FieldLegend variant="label">permissions</FieldLegend>
            <FieldDescription>every access token has builds:read</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              {OPTIONAL_PERMISSIONS.map(({ resource, action }) => {
                const id = `permission-${resource}-${action}`;

                return (
                  <Controller
                    key={id}
                    control={control}
                    name={`permissions.${resource}`}
                    render={({ field }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={id}
                          checked={field.value?.includes(action) ?? false}
                          onCheckedChange={(checked) => field.onChange(checked ? [action] : [])}
                        />
                        <FieldLabel htmlFor={id}>{`${resource}:${action}`}</FieldLabel>
                      </Field>
                    )}
                  />
                );
              })}
            </FieldGroup>
          </FieldSet>
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
