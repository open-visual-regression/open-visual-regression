import type { DiffSettings } from "@ovr/api/contracts/settings";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { DiffSettingsForm, DiffSettingsFormSkeleton } from "./DiffSettingsForm";

type DiffSettingsSectionProps = {
  settings: DiffSettings;
};

export const DiffSettingsSection = ({ settings }: DiffSettingsSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2" as="h2">
      diffs
    </Typography>
    <DiffSettingsForm settings={settings} />
  </div>
);

export const DiffSettingsSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="h2" className="w-24" />
    <DiffSettingsFormSkeleton />
  </div>
);
