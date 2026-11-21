import { storedDiffSettingsSchema, type DiffSettings } from "@ovr/api/contracts/settings";
import { dbClient } from "@ovr/db/client";

export const getDiffSettings = async (): Promise<DiffSettings> => {
  const stored = await dbClient.settings.find("diff_images");
  return storedDiffSettingsSchema.parse(stored?.value);
};

export const saveDiffSettings = async (
  settings: DiffSettings,
  updatedBy: string,
): Promise<void> => {
  await dbClient.settings.upsert({ key: "diff_images", value: settings, updatedBy });
};
