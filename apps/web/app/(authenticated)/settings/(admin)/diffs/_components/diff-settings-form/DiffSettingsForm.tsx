"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import {
  diffSettingsSchema,
  type DiffAlgorithm,
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

const ALGORITHMS: { value: DiffAlgorithm; label: string; description: string }[] = [
  {
    value: "aligned",
    label: "aligned",
    description:
      "lines the screenshots up first, so content that only moved down or sideways isn't marked",
  },
  {
    value: "pixel",
    label: "pixel by pixel",
    description:
      "compares each pixel with the one in the same place, so everything below an insertion is marked",
  },
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

  const { execute, status } = useServerAction(serverClient.settings.updateDiff, {
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
    toast.success("diff settings updated");
  };

  const isSubmitting = status === "pending";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Card size="default" className="w-full md:w-2/3 lg:w-1/2">
        <CardContent className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={!!errors.algorithm}>
              <FieldLabel htmlFor="algorithm">algorithm</FieldLabel>
              <Controller
                control={control}
                name="algorithm"
                render={({ field }) => (
                  <>
                    <Select items={ALGORITHMS} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="algorithm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALGORITHMS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {ALGORITHMS.find((option) => option.value === field.value)?.description}
                    </FieldDescription>
                  </>
                )}
              />
              <FieldError errors={[errors.algorithm]} />
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
