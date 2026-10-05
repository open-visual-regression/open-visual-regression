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
