import type { CaptureQueue } from "@ovr/api/contracts/jobs";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { CaptureQueueForm, CaptureQueueFormSkeleton } from "./CaptureQueueForm";

type CaptureQueueSectionProps = CaptureQueue;

export const CaptureQueueSection = (props: CaptureQueueSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        capture queue
      </Typography>
      <Typography variant="body-muted" as="p">
        the order capture groups run in across builds. applies to builds queued after you save.
      </Typography>
    </div>
    <CaptureQueueForm {...props} />
  </div>
);

export const CaptureQueueSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <TypographySkeleton variant="h2" className="w-40" />
      <TypographySkeleton variant="body-muted" className="w-72" />
    </div>
    <CaptureQueueFormSkeleton />
  </div>
);
