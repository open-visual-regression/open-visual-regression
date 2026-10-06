import type { FlakyDetection } from "@ovr/api/contracts/jobs";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { formatRelativeDateTime } from "@/lib/utils/date";

import { FlakyDetectionForm, FlakyDetectionFormSkeleton } from "./FlakyDetectionForm";

type FlakyDetectionSectionProps = FlakyDetection;

export const FlakyDetectionSection = ({
  settings,
  lastRunAt,
  running,
}: FlakyDetectionSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        flaky detection
      </Typography>
      <Typography variant="body-muted" as="p">
        {lastRunAt ? `last run: ${formatRelativeDateTime(new Date(lastRunAt))}` : "last run: never"}
      </Typography>
    </div>
    <FlakyDetectionForm settings={settings} running={running} />
  </div>
);

export const FlakyDetectionSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <TypographySkeleton variant="h2" className="w-40" />
      <TypographySkeleton variant="body-muted" className="w-32" />
    </div>
    <FlakyDetectionFormSkeleton />
  </div>
);
