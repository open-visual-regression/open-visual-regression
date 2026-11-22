import { TypographySkeleton } from "@ovr/ui/components/typography";

import { DiffSettingsSectionSkeleton } from "./_components/diff-settings-section/DiffSettingsSection";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <DiffSettingsSectionSkeleton />
    </div>
  );
}
