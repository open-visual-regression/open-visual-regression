import { oc } from "@orpc/contract";
import { z } from "zod";

export const diffAlgorithmSchema = z.enum(["smart", "exact"]);

export type DiffAlgorithm = z.infer<typeof diffAlgorithmSchema>;

export const diffSettingsSchema = z.object({
  algorithm: diffAlgorithmSchema,
});

export type DiffSettings = z.infer<typeof diffSettingsSchema>;

export const DEFAULT_DIFF_SETTINGS: DiffSettings = {
  algorithm: "smart",
};

/** Falls back to the defaults for anything missing or invalid. */
export const storedDiffSettingsSchema = z
  .object({
    algorithm: diffAlgorithmSchema.catch(DEFAULT_DIFF_SETTINGS.algorithm),
  })
  .catch(DEFAULT_DIFF_SETTINGS);

export const getDiffSettingsContract = oc.output(z.object({ settings: diffSettingsSchema }));

export const updateDiffSettingsContract = oc.input(diffSettingsSchema).output(z.void());

export const contract = {
  getDiff: getDiffSettingsContract,
  updateDiff: updateDiffSettingsContract,
} as const;
