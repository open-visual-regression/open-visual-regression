"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ovr/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";
import { z } from "zod";
import { serverClient } from "@/lib/router";

const addCaptureConfigurationSchema = z.object({
  name: z.string().min(1, "you must enter a name").max(255),
  browser: z.enum(["chromium", "firefox", "webkit"]),
  viewportWidth: z.number().int().positive("width must be a positive number"),
  viewportHeight: z.number().int().positive("height must be a positive number"),
});

type AddCaptureConfigurationValues = z.infer<typeof addCaptureConfigurationSchema>;

type AddCaptureConfigurationModalFormProps = {
  projectId: string;
  onAddAction: () => void;
};

export const AddCaptureConfigurationModalForm = ({
  projectId,
  onAddAction,
}: AddCaptureConfigurationModalFormProps) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
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

  const { execute, status } = useServerAction(serverClient.captureConfigurations.add, {
    interceptors: [
      onSuccess(() => {
        router.refresh();
        onAddAction();
      }),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleFormSubmit = (values: AddCaptureConfigurationValues) => {
    execute({ projectId, data: values });
  };

  const isSubmitting = status === "pending";

  return (
    <>
      <DialogHeader>
        <DialogTitle>add capture configuration</DialogTitle>
        <DialogDescription>
          define a browser and viewport for capturing screenshots
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <FieldGroup className="pb-6">
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
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <FieldError errors={[errors.root]} />
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "adding..." : "add"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
