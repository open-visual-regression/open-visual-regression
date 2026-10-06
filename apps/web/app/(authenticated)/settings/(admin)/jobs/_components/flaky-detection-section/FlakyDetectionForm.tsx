"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Controller, useForm, useWatch } from "react-hook-form";

import type { FlakyDetectionSettings } from "@ovr/api/contracts/jobs";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldSkeleton,
} from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Switch } from "@ovr/ui/components/switch";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { flakyDetectionFormSchema, type FlakyDetectionFormValues } from "./schema";

export type FlakyDetectionFormProps = {
  settings: FlakyDetectionSettings;
};

export const FlakyDetectionForm = ({ settings }: FlakyDetectionFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FlakyDetectionFormValues>({
    resolver: zodResolver(flakyDetectionFormSchema),
    defaultValues: settings,
  });

  const enabled = useWatch({ control, name: "enabled" });

  const { execute, status } = useServerAction(serverClient.jobs.updateFlakyDetection, {
    interceptors: [
      onSuccess(() => {
        toast.success("flaky detection updated");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: FlakyDetectionFormValues) => {
    execute(values);
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full">
        <CardContent className="flex flex-col gap-5">
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <FieldLabel htmlFor="enabled">detect flaky stories</FieldLabel>
          </Field>
          <FieldSet disabled={!enabled}>
            <FieldGroup>
              <Field data-invalid={!!errors.cron}>
                <FieldLabel htmlFor="cron">schedule (cron)</FieldLabel>
                <Input
                  id="cron"
                  placeholder="0 7,19 * * *"
                  aria-invalid={!!errors.cron}
                  {...register("cron")}
                />
                <FieldError errors={[errors.cron]} />
              </Field>
              <Field data-invalid={!!errors.windowBuilds}>
                <FieldLabel htmlFor="windowBuilds">builds to look back on</FieldLabel>
                <Input
                  id="windowBuilds"
                  type="number"
                  min={1}
                  step={1}
                  aria-invalid={!!errors.windowBuilds}
                  {...register("windowBuilds", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.windowBuilds]} />
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-row justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Icon icon={CheckIcon} />
            {isSubmitting ? "saving..." : "save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export const FlakyDetectionFormSkeleton = () => (
  <Card size="default" aria-hidden className="w-full">
    <CardContent className="flex flex-col gap-5">
      <Skeleton className="h-4 w-40" />
      <FieldGroup>
        <FieldSkeleton />
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
