import { oc } from "@orpc/contract";
import { z } from "zod";

/**
 * How diff images are drawn. "aligned" lines the screenshots up first, so
 * content that only moved isn't marked; "pixel" compares each pixel with the
 * one at the same position.
 */
export const diffAlgorithmSchema = z.enum(["aligned", "pixel"]);

export type DiffAlgorithm = z.infer<typeof diffAlgorithmSchema>;

export const diffSettingsSchema = z.object({
  algorithm: diffAlgorithmSchema,
});

export type DiffSettings = z.infer<typeof diffSettingsSchema>;

export const DEFAULT_DIFF_SETTINGS: DiffSettings = {
  algorithm: "aligned",
};

/** Reads stored diff settings, falling back to the defaults for anything missing or invalid. */
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
