import type { FlakyDetectionSettings } from "@ovr/api/contracts/jobs";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { FlakyDetectionForm, FlakyDetectionFormSkeleton } from "./FlakyDetectionForm";

type FlakyDetectionSectionProps = {
  settings: FlakyDetectionSettings;
};

export const FlakyDetectionSection = ({ settings }: FlakyDetectionSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="h2" as="h2">
      flaky detection
    </Typography>
    <FlakyDetectionForm settings={settings} />
  </div>
);

export const FlakyDetectionSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="h2" className="w-40" />
    <FlakyDetectionFormSkeleton />
  </div>
);
