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
  minReverts: z.number().int().positive(),
  minSamples: z.number().int().min(2),
  minChangeRate: z.number().positive().max(1),
});

export type FlakyDetectionSettings = z.infer<typeof flakyDetectionSettingsSchema>;

export const DEFAULT_FLAKY_DETECTION_SETTINGS: FlakyDetectionSettings = {
  enabled: false,
  cron: "17 * * * *",
  windowBuilds: 30,
  minReverts: 2,
  minSamples: 10,
  minChangeRate: 0.5,
};

const { shape } = flakyDetectionSettingsSchema;

// Stored settings may predate a field or hold a value that no longer validates,
// so each field falls back to its default on its own.
export const storedFlakyDetectionSettingsSchema = z
  .object({
    enabled: shape.enabled.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.enabled),
    cron: shape.cron.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.cron),
    windowBuilds: shape.windowBuilds.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.windowBuilds),
    minReverts: shape.minReverts.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.minReverts),
    minSamples: shape.minSamples.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.minSamples),
    minChangeRate: shape.minChangeRate.catch(DEFAULT_FLAKY_DETECTION_SETTINGS.minChangeRate),
  })
  .catch(DEFAULT_FLAKY_DETECTION_SETTINGS);
