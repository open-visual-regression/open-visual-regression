import { z } from "zod";

import { cronPatternSchema } from "@ovr/api/contracts/jobs";

export const flakyDetectionFormSchema = z.object({
  enabled: z.boolean(),
  cron: z.string().refine((cron) => cronPatternSchema.safeParse(cron).success, {
    error: "you must enter a valid cron pattern",
  }),
  windowBuilds: z
    .number({ error: "you must enter a whole number of builds" })
    .int("you must enter a whole number of builds")
    .positive("you must enter a whole number of builds"),
});

export type FlakyDetectionFormValues = z.infer<typeof flakyDetectionFormSchema>;
