"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import {
  diffSettingsSchema,
  type DiffHighlight,
  type DiffSettings,
} from "@ovr/api/contracts/settings";
import { Button } from "@ovr/ui/components/button";
import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
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

const DIFF_HIGHLIGHT_OPTIONS: { value: DiffHighlight; label: string; description: string }[] = [
  { value: "smart", label: "smart", description: "highlights only the content that has changed" },
  { value: "exact", label: "exact", description: "marks every pixel that changed" },
];

export type DiffSettingsFormProps = {
  settings: DiffSettings;
};

export const DiffSettingsForm = ({ settings }: DiffSettingsFormProps) => {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<DiffSettings>({
    resolver: zodResolver(diffSettingsSchema),
    defaultValues: settings,
  });

  const { execute, status } = useServerAction(serverClient.settings.updateDiffSettings, {
    interceptors: [
      onSuccess(() => {
        router.refresh();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = async (values: DiffSettings) => {
    const [error] = await execute(values);

    if (error) {
      return;
    }

    reset(values);
    toast.success("diff settings saved");
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={!!errors.highlight}>
              <FieldLabel htmlFor="highlight">highlight</FieldLabel>
              <Controller
                control={control}
                name="highlight"
                render={({ field }) => (
                  <>
                    <Select
                      items={DIFF_HIGHLIGHT_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="highlight" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFF_HIGHLIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {
                        DIFF_HIGHLIGHT_OPTIONS.find((option) => option.value === field.value)
                          ?.description
                      }
                    </FieldDescription>
                  </>
                )}
              />
              <FieldError errors={[errors.highlight]} />
            </Field>
          </FieldGroup>
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

export const DiffSettingsFormSkeleton = () => (
  <Card size="default" aria-hidden className="w-full md:w-2/3 lg:w-1/2">
    <CardContent className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </CardFooter>
  </Card>
);
