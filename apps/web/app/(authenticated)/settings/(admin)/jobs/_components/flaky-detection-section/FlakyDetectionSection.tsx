import type { FlakyDetection } from "@ovr/api/contracts/jobs";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { formatRelativeDateTime } from "@/lib/utils/date";

import { FlakyDetectionForm, FlakyDetectionFormSkeleton } from "./FlakyDetectionForm";

type FlakyDetectionSectionProps = FlakyDetection;

const formatRuns = (lastRunAt: string | null, nextRunAt: string | null): string => {
  const lastRun = `last run: ${lastRunAt ? formatRelativeDateTime(new Date(lastRunAt)) : "never"}`;

  return nextRunAt
    ? `${lastRun} · next run: ${formatRelativeDateTime(new Date(nextRunAt))}`
    : lastRun;
};

export const FlakyDetectionSection = ({
  settings,
  lastRunAt,
  nextRunAt,
  running,
}: FlakyDetectionSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        flaky detection
      </Typography>
      <Typography variant="body-muted" as="p">
        {formatRuns(lastRunAt, nextRunAt)}
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
