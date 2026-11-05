"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  CAPTURE_QUEUE_POLICIES,
  captureQueueSettingsSchema,
  type CaptureQueue,
  type CaptureQueuePolicy,
  type CaptureQueueSettings,
} from "@ovr/api/contracts/jobs";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSkeleton,
} from "@ovr/ui/components/field";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

export const POLICY_DESCRIPTIONS: Record<CaptureQueuePolicy, string> = {
  deadline:
    "runs the build due soonest, each due 5 seconds per snapshot after it's queued, so small builds go first without starving large ones. retried groups run first.",
  "round-robin": "takes one group per browser from each build in turn. retried groups run first.",
  fifo: "runs groups in the order they were queued.",
};

export type CaptureQueueFormProps = CaptureQueue;

export const CaptureQueueForm = ({ settings, envPolicy }: CaptureQueueFormProps) => {
  const router = useRouter();
  const locked = envPolicy !== null;
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<CaptureQueueSettings>({
    resolver: zodResolver(captureQueueSettingsSchema),
    defaultValues: locked ? { policy: envPolicy } : settings,
  });

  const policy = useWatch({ control, name: "policy" });

  const { execute, status } = useServerAction(serverClient.jobs.updateCaptureQueue, {
    interceptors: [
      onSuccess(() => {
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = async (values: CaptureQueueSettings) => {
    const [error] = await execute(values);

    if (error) {
      return;
    }

    reset(values);
    toast.success("capture queue updated");
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          {locked ? (
            <Alert color="amber">
              <AlertTitle>set by the server</AlertTitle>
              <AlertDescription>
                OVR_CAPTURE_QUEUE_POLICY is set to {envPolicy}, which overrides this setting. unset
                it on the web app and workers to choose the policy here.
              </AlertDescription>
            </Alert>
          ) : null}
          <Field data-invalid={!!errors.policy}>
            <FieldLabel htmlFor="policy">policy</FieldLabel>
            <Controller
              control={control}
              name="policy"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                  <SelectTrigger id="policy" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPTURE_QUEUE_POLICIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>{POLICY_DESCRIPTIONS[policy]}</FieldDescription>
            <FieldError errors={[errors.policy]} />
          </Field>
          <FieldError errors={[errors.root]} />
        </CardContent>
        <CardFooter className="flex flex-row justify-end">
          <Button type="submit" disabled={locked || isSubmitting}>
            <Icon icon={CheckIcon} />
            {isSubmitting ? "saving..." : "save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export const CaptureQueueFormSkeleton = () => (
  <Card size="default" aria-hidden className="w-full md:w-2/3 lg:w-1/2">
    <CardContent className="flex flex-col gap-5">
      <FieldSkeleton />
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
