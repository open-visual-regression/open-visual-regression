import { TypographySkeleton } from "@ovr/ui/components/typography";

import { DiffSettingsFormSkeleton } from "./_components/diff-settings-form/DiffSettingsForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <div className="flex flex-col gap-4">
        <TypographySkeleton variant="h2" className="w-24" />
        <DiffSettingsFormSkeleton />
      </div>
    </div>
  );
}
