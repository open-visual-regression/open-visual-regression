import { z } from "zod";

import { cronPatternSchema, type FlakyDetectionSettings } from "@ovr/api/contracts/jobs";

export const CUSTOM_SCHEDULE = "custom";

export const SCHEDULE_PRESETS = [
  { value: "17 * * * *", label: "hourly" },
  { value: "17 */6 * * *", label: "every 6 hours" },
  { value: "17 3 * * *", label: "daily" },
] as const;

const wholeNumber = (message: string) =>
  z.number({ error: message }).int(message).positive(message);

export const flakyDetectionFormSchema = z
  .object({
    enabled: z.boolean(),
    schedule: z.string(),
    customCron: z.string(),
    windowBuilds: wholeNumber("you must enter a whole number of builds"),
    minReverts: wholeNumber("you must enter a whole number of returns"),
    minSamples: z
      .number({ error: "you must enter a whole number of captures" })
      .int("you must enter a whole number of captures")
      .min(2, "you must require at least 2 captures"),
    minChangeRate: z
      .number({ error: "you must enter a change rate" })
      .positive("the change rate must be above 0")
      .max(1, "the change rate must be 1 or less"),
  })
  .refine(
    ({ schedule, customCron }) =>
      schedule !== CUSTOM_SCHEDULE || cronPatternSchema.safeParse(customCron).success,
    { path: ["customCron"], error: "you must enter a valid cron pattern" },
  );

export type FlakyDetectionFormValues = z.infer<typeof flakyDetectionFormSchema>;

export const toFormValues = (settings: FlakyDetectionSettings): FlakyDetectionFormValues => {
  const isPreset = SCHEDULE_PRESETS.some((preset) => preset.value === settings.cron);

  return {
    enabled: settings.enabled,
    schedule: isPreset ? settings.cron : CUSTOM_SCHEDULE,
    customCron: isPreset ? "" : settings.cron,
    windowBuilds: settings.windowBuilds,
    minReverts: settings.minReverts,
    minSamples: settings.minSamples,
    minChangeRate: settings.minChangeRate,
  };
};

export const toSettings = ({
  schedule,
  customCron,
  ...values
}: FlakyDetectionFormValues): FlakyDetectionSettings => ({
  ...values,
  cron: schedule === CUSTOM_SCHEDULE ? customCron.trim() : schedule,
});
