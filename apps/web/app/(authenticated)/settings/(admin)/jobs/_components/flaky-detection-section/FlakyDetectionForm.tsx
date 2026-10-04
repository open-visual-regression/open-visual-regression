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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldSkeleton,
} from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Switch } from "@ovr/ui/components/switch";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import {
  CUSTOM_SCHEDULE,
  SCHEDULE_PRESETS,
  flakyDetectionFormSchema,
  toFormValues,
  toSettings,
  type FlakyDetectionFormValues,
} from "./schema";

const SCHEDULE_OPTIONS = [...SCHEDULE_PRESETS, { value: CUSTOM_SCHEDULE, label: "custom" }];

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
    defaultValues: toFormValues(settings),
  });

  const enabled = useWatch({ control, name: "enabled" });
  const schedule = useWatch({ control, name: "schedule" });

  const { execute, status } = useServerAction(serverClient.jobs.updateFlakyDetection, {
    interceptors: [
      onSuccess(() => {
        toast.success("flaky detection updated");
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: FlakyDetectionFormValues) => {
    execute(toSettings(values));
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="enabled">detect flaky stories</FieldLabel>
              <FieldDescription>
                flag stories whose screenshots keep changing between main-branch builds
              </FieldDescription>
            </FieldContent>
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
          <FieldSet disabled={!enabled}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="schedule">schedule</FieldLabel>
                <Controller
                  control={control}
                  name="schedule"
                  render={({ field }) => (
                    <Select
                      items={SCHEDULE_OPTIONS}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={!enabled}
                    >
                      <SelectTrigger id="schedule" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>how often stories are re-evaluated</FieldDescription>
              </Field>
              {schedule === CUSTOM_SCHEDULE ? (
                <Field data-invalid={!!errors.customCron}>
                  <FieldLabel htmlFor="customCron">cron pattern</FieldLabel>
                  <Input
                    id="customCron"
                    placeholder="0 */12 * * *"
                    aria-invalid={!!errors.customCron}
                    {...register("customCron")}
                  />
                  <FieldError errors={[errors.customCron]} />
                </Field>
              ) : null}
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
                <FieldDescription>recent main-branch builds considered per story</FieldDescription>
                <FieldError errors={[errors.windowBuilds]} />
              </Field>
              <Field data-invalid={!!errors.minReverts}>
                <FieldLabel htmlFor="minReverts">returns to an earlier look</FieldLabel>
                <Input
                  id="minReverts"
                  type="number"
                  min={1}
                  step={1}
                  aria-invalid={!!errors.minReverts}
                  {...register("minReverts", { valueAsNumber: true })}
                />
                <FieldDescription>
                  times a story must go back to a look it had before to be marked flaky
                </FieldDescription>
                <FieldError errors={[errors.minReverts]} />
              </Field>
              <Field data-invalid={!!errors.minSamples}>
                <FieldLabel htmlFor="minSamples">captures before the change rate counts</FieldLabel>
                <Input
                  id="minSamples"
                  type="number"
                  min={2}
                  step={1}
                  aria-invalid={!!errors.minSamples}
                  {...register("minSamples", { valueAsNumber: true })}
                />
                <FieldDescription>
                  captures a story needs before a high change rate alone marks it flaky
                </FieldDescription>
                <FieldError errors={[errors.minSamples]} />
              </Field>
              <Field data-invalid={!!errors.minChangeRate}>
                <FieldLabel htmlFor="minChangeRate">change rate</FieldLabel>
                <Input
                  id="minChangeRate"
                  type="number"
                  min={0.05}
                  max={1}
                  step={0.05}
                  aria-invalid={!!errors.minChangeRate}
                  {...register("minChangeRate", { valueAsNumber: true })}
                />
                <FieldDescription>
                  share of builds a story must change in to be marked flaky, up to 1
                </FieldDescription>
                <FieldError errors={[errors.minChangeRate]} />
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
  <Card size="default" aria-hidden className="w-full md:w-2/3 lg:w-1/2">
    <CardContent className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
