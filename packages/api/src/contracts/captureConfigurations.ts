import { oc } from "@orpc/contract";
import { z } from "zod";

export const captureConfigurationSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  browser: z.enum(["chromium", "firefox", "webkit"]),
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
});

export type CaptureConfigurationDto = z.infer<typeof captureConfigurationSchema>;

export const listCaptureConfigurationsInputSchema = z.object({
  projectId: z.uuidv7(),
});

export const listCaptureConfigurationsOutputSchema = z.object({
  captureConfigurations: z.array(captureConfigurationSchema),
});

export const listCaptureConfigurationsContract = oc
  .input(listCaptureConfigurationsInputSchema)
  .output(listCaptureConfigurationsOutputSchema);

export const addCaptureConfigurationInputSchema = z.object({
  projectId: z.uuidv7(),
  data: z.object({
    name: z.string().min(1).max(255),
    browser: z.enum(["chromium", "firefox", "webkit"]),
    viewportWidth: z.number().int().positive(),
    viewportHeight: z.number().int().positive(),
  }),
});

export const addCaptureConfigurationContract = oc
  .input(addCaptureConfigurationInputSchema)
  .output(z.void());

export const removeCaptureConfigurationInputSchema = z.object({
  captureConfigurationId: z.uuidv7(),
});

export const removeCaptureConfigurationContract = oc
  .input(removeCaptureConfigurationInputSchema)
  .output(z.void());

export const contract = {
  list: listCaptureConfigurationsContract,
  add: addCaptureConfigurationContract,
  remove: removeCaptureConfigurationContract,
} as const;
