import { TypographySkeleton } from "@ovr/ui/components/typography";

import { FlakyDetectionSectionSkeleton } from "./_components/flaky-detection-section/FlakyDetectionSection";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <FlakyDetectionSectionSkeleton />
    </div>
  );
}
