import { oc } from "@orpc/contract";
import cronParser from "cron-parser";
import { z } from "zod";

const isCronPattern = (pattern: string): boolean => {
  try {
    cronParser.parseExpression(pattern);
    return true;
  } catch {
    return false;
  }
};

export const cronPatternSchema = z
  .string()
  .trim()
  .refine(isCronPattern, { error: "must be a valid cron pattern" });

export const flakyDetectionSettingsSchema = z.object({
  enabled: z.boolean(),
  cron: cronPatternSchema,
  windowBuilds: z.number().int().positive(),
});

export type FlakyDetectionSettings = z.infer<typeof flakyDetectionSettingsSchema>;

export const DEFAULT_FLAKY_DETECTION_SETTINGS: FlakyDetectionSettings = {
  enabled: false,
  cron: "0 7,19 * * *",
  windowBuilds: 30,
};

const { shape } = flakyDetectionSettingsSchema;

export const storedFlakyDetectionSettingsSchema = z
  .object({
    enabled: shape.enabled.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.enabled),
    cron: shape.cron.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.cron),
    windowBuilds: shape.windowBuilds.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.windowBuilds),
  })
  .catch(DEFAULT_FLAKY_DETECTION_SETTINGS);

export const getFlakyDetectionOutputSchema = z.object({
  settings: flakyDetectionSettingsSchema,
  lastRunAt: z.iso.datetime().nullable(),
  nextRunAt: z.iso.datetime().nullable(),
  running: z.boolean(),
});

export type FlakyDetection = z.infer<typeof getFlakyDetectionOutputSchema>;

export const getFlakyDetectionContract = oc.output(getFlakyDetectionOutputSchema);

export const updateFlakyDetectionContract = oc.input(flakyDetectionSettingsSchema).output(z.void());

export const runFlakyDetectionContract = oc.output(z.void());

export const CAPTURE_QUEUE_POLICIES = ["deadline", "round-robin", "fifo"] as const;

export const captureQueuePolicySchema = z.enum(CAPTURE_QUEUE_POLICIES);

export type CaptureQueuePolicy = z.infer<typeof captureQueuePolicySchema>;

export const captureQueueSettingsSchema = z.object({
  policy: captureQueuePolicySchema,
});

export type CaptureQueueSettings = z.infer<typeof captureQueueSettingsSchema>;

export const DEFAULT_CAPTURE_QUEUE_SETTINGS: CaptureQueueSettings = {
  policy: "deadline",
};

export const storedCaptureQueueSettingsSchema = z
  .object({
    policy: captureQueuePolicySchema.catch(DEFAULT_CAPTURE_QUEUE_SETTINGS.policy),
  })
  .catch(DEFAULT_CAPTURE_QUEUE_SETTINGS);

export const getCaptureQueueOutputSchema = z.object({
  settings: captureQueueSettingsSchema,
  /** The policy OVR_CAPTURE_QUEUE_POLICY sets, which wins over the saved settings. */
  envPolicy: captureQueuePolicySchema.nullable(),
});

export type CaptureQueue = z.infer<typeof getCaptureQueueOutputSchema>;

export const getCaptureQueueContract = oc.output(getCaptureQueueOutputSchema);

export const updateCaptureQueueContract = oc.input(captureQueueSettingsSchema).output(z.void());

export const contract = {
  getFlakyDetection: getFlakyDetectionContract,
  updateFlakyDetection: updateFlakyDetectionContract,
  runFlakyDetection: runFlakyDetectionContract,
  getCaptureQueue: getCaptureQueueContract,
  updateCaptureQueue: updateCaptureQueueContract,
} as const;
