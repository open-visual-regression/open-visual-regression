import { oc } from "@orpc/contract";
import { z } from "zod";

export const diffHighlightSchema = z.enum(["smart", "exact"]);

export type DiffHighlight = z.infer<typeof diffHighlightSchema>;

export const diffSettingsSchema = z.object({
  highlight: diffHighlightSchema,
});

export type DiffSettings = z.infer<typeof diffSettingsSchema>;

export const DEFAULT_DIFF_SETTINGS: DiffSettings = {
  highlight: "smart",
};

/** Falls back to the defaults for anything missing or invalid. */
export const storedDiffSettingsSchema = z
  .object({
    highlight: diffHighlightSchema.catch(DEFAULT_DIFF_SETTINGS.highlight),
  })
  .catch(DEFAULT_DIFF_SETTINGS);

export const getDiffSettingsContract = oc.output(z.object({ settings: diffSettingsSchema }));

export const updateDiffSettingsContract = oc.input(diffSettingsSchema).output(z.void());

export const contract = {
  getDiffSettings: getDiffSettingsContract,
  updateDiffSettings: updateDiffSettingsContract,
} as const;
