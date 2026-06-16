"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Icon, PlusIcon, XIcon } from "@ovr/ui/components/icon";
import { Input } from "@ovr/ui/components/input";
import { Typography } from "@ovr/ui/components/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@ovr/ui/components/table";
import { z } from "zod";
import { serverClient } from "@/lib/router";
import type { CaptureConfigurationDto } from "@ovr/api/contracts/projects";

const addCaptureConfigurationSchema = z.object({
  name: z.string().min(1, "you must enter a name").max(255),
  browser: z.enum(["chromium", "firefox", "webkit"]),
  viewportWidth: z.number().int().positive("width must be a positive number"),
  viewportHeight: z.number().int().positive("height must be a positive number"),
});

type AddCaptureConfigurationValues = z.infer<typeof addCaptureConfigurationSchema>;

type CaptureConfigurationsSectionProps = {
  projectId: string;
  captureConfigurations: CaptureConfigurationDto[];
};

export const CaptureConfigurationsSection = ({
  projectId,
  captureConfigurations: initialConfigs,
}: CaptureConfigurationsSectionProps) => {
  const router = useRouter();
  const [addError, setAddError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddCaptureConfigurationValues>({
    resolver: zodResolver(addCaptureConfigurationSchema),
    defaultValues: {
      name: "",
      browser: "chromium",
      viewportWidth: 1280,
      viewportHeight: 800,
    },
  });

  const { execute: executeAdd, status: addStatus } = useServerAction(
    serverClient.projects.addCaptureConfiguration,
    {
      interceptors: [
        onSuccess(() => {
          reset();
          setAddError(null);
          router.refresh();
        }),
        onError((err) => setAddError(err.message)),
      ],
    },
  );

  const { execute: executeRemove } = useServerAction(
    serverClient.projects.removeCaptureConfiguration,
    {
      interceptors: [onSuccess(() => router.refresh())],
    },
  );

  const handleAdd = (values: AddCaptureConfigurationValues) => {
    executeAdd({ projectId, data: values });
  };

  const isAdding = addStatus === "pending";

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="label">capture configurations</Typography>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>name</TableHead>
            <TableHead>browser</TableHead>
            <TableHead>viewport</TableHead>
            <TableHead className="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialConfigs.length === 0 ? (
            <TableEmpty colSpan={4}>no capture configurations yet</TableEmpty>
          ) : (
            initialConfigs.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{config.name}</TableCell>
                <TableCell>{config.browser}</TableCell>
                <TableCell>
                  {config.viewportWidth}×{config.viewportHeight}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`remove ${config.name}`}
                    onClick={() => executeRemove({ captureConfigurationId: config.id })}
                  >
                    <Icon icon={XIcon} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <form onSubmit={handleSubmit(handleAdd)} noValidate>
        <div className="flex flex-col gap-2">
          <Typography variant="label">add configuration</Typography>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="config-name">name</FieldLabel>
                <Input
                  id="config-name"
                  placeholder="desktop"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={!!errors.browser}>
                <FieldLabel htmlFor="config-browser">browser</FieldLabel>
                <Select
                  defaultValue="chromium"
                  onValueChange={(value) =>
                    setValue("browser", value as "chromium" | "firefox" | "webkit")
                  }
                >
                  <SelectTrigger id="config-browser" aria-invalid={!!errors.browser}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chromium">chromium</SelectItem>
                    <SelectItem value="firefox">firefox</SelectItem>
                    <SelectItem value="webkit">webkit</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.browser]} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={!!errors.viewportWidth}>
                <FieldLabel htmlFor="config-width">width</FieldLabel>
                <Input
                  id="config-width"
                  type="number"
                  placeholder="1280"
                  aria-invalid={!!errors.viewportWidth}
                  {...register("viewportWidth", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.viewportWidth]} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={!!errors.viewportHeight}>
                <FieldLabel htmlFor="config-height">height</FieldLabel>
                <Input
                  id="config-height"
                  type="number"
                  placeholder="800"
                  aria-invalid={!!errors.viewportHeight}
                  {...register("viewportHeight", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.viewportHeight]} />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={isAdding}>
              <Icon icon={PlusIcon} />
              {isAdding ? "adding..." : "add"}
            </Button>
          </div>
          {addError && <FieldError errors={[{ message: addError }]} />}
        </div>
      </form>
    </div>
  );
};
