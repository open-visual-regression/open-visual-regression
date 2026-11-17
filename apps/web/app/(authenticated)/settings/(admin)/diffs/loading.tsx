import { TypographySkeleton } from "@ovr/ui/components/typography";

import { DiffSettingsFormSkeleton } from "./_components/diff-settings-form/DiffSettingsForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <TypographySkeleton variant="h1" className="w-40" />
        <TypographySkeleton variant="body-muted" className="w-72" />
      </div>
      <DiffSettingsFormSkeleton />
    </div>
  );
}
