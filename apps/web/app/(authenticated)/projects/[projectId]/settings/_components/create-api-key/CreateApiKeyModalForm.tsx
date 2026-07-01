"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { API_KEY_NAME_MAX_LENGTH } from "@ovr/api/contracts/apiKeys";
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

import { CreateApiKeyModalReveal } from "./CreateApiKeyModalReveal";

const createApiKeyFormSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter a name")
    .max(
      API_KEY_NAME_MAX_LENGTH,
      `the name must be less than ${API_KEY_NAME_MAX_LENGTH} characters`,
    ),
});

type CreateApiKeyFormValues = z.infer<typeof createApiKeyFormSchema>;

type CreateApiKeyModalFormProps = {
  projectId: string;
};

export const CreateApiKeyModalForm = ({ projectId }: CreateApiKeyModalFormProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeyFormSchema),
    defaultValues: { name: "" },
  });

  const { execute, status } = useServerAction(serverClient.apiKeys.create, {
    interceptors: [
      onSuccess(({ key }) => setApiKey(key)),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  if (apiKey) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>api key created</DialogTitle>
        </DialogHeader>
        <CreateApiKeyModalReveal apiKey={apiKey} />
      </>
    );
  }

  const handleFormSubmit = (values: CreateApiKeyFormValues) => {
    execute({ projectId, ...values });
  };

  const isSubmitting = status === "pending";

  return (
    <>
      <DialogHeader>
        <DialogTitle>new api key</DialogTitle>
        <DialogDescription>used to authenticate uploads for this project</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <FieldGroup className="pb-6">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">name</FieldLabel>
            <Input
              id="name"
              placeholder="enter a name for the api key"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldDescription>a label to help identify this api key later</FieldDescription>
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
