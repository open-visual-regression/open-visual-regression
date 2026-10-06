"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { CheckIcon, Icon, PlayIcon, RefreshCwIcon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Switch } from "@ovr/ui/components/switch";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { flakyDetectionFormSchema, type FlakyDetectionFormValues } from "./schema";

export const RUNNING_POLL_INTERVAL_MS = 2_000;

export type FlakyDetectionFormProps = {
  settings: FlakyDetectionSettings;
  running: boolean;
};

export const FlakyDetectionForm = ({ settings, running }: FlakyDetectionFormProps) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<FlakyDetectionFormValues>({
    resolver: zodResolver(flakyDetectionFormSchema),
    defaultValues: settings,
  });

  const enabled = useWatch({ control, name: "enabled" });

  const { execute, status } = useServerAction(serverClient.jobs.updateFlakyDetection, {
    interceptors: [
      onSuccess(() => {
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const save = async (values: FlakyDetectionFormValues): Promise<boolean> => {
    const [error] = await execute(values);

    if (error) {
      return false;
    }

    reset(values);
    return true;
  };

  const handleFormSubmit = async (values: FlakyDetectionFormValues) => {
    if (await save(values)) {
      toast.success("flaky detection updated");
    }
  };

  const isSubmitting = status === "pending";

  const { execute: runNow, status: runStatus } = useServerAction(
    serverClient.jobs.runFlakyDetection,
    {
      interceptors: [
        onSuccess(() => {
          toast.success("flaky detection started");
          router.refresh();
        }),
        onError((err) => {
          toast.error(err.message);
        }),
      ],
    },
  );

  const isRunning = running || runStatus === "pending";

  // Run with what is on screen, so unsaved changes are saved first.
  const handleRunNow = handleSubmit(async (values) => {
    if (isDirty && !(await save(values))) {
      return;
    }

    await runNow();
  });

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = setInterval(() => router.refresh(), RUNNING_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, router]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <FieldLabel htmlFor="enabled">enabled</FieldLabel>
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
        <CardFooter className="flex flex-row justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!enabled || isRunning || isSubmitting}
            onClick={handleRunNow}
          >
            {isRunning ? (
              <Icon icon={RefreshCwIcon} className="animate-spin" />
            ) : (
              <Icon icon={PlayIcon} />
            )}
            {isRunning ? "running..." : "run now"}
          </Button>
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
  <Card size="default" aria-hidden className="w-full md:w-2/3 lg:w-1/2">
    <CardContent className="flex flex-col gap-5">
      <Skeleton className="h-4 w-40" />
      <FieldGroup>
        <FieldSkeleton />
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-between">
      <Skeleton className="h-8 w-28 rounded-lg" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
