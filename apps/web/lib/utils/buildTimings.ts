import { type BuildSchema } from "@ovr/api/contracts/builds";

import { formatDuration } from "./date";

/** Queue and processing split, e.g. "12s queued, 2m 2s processing". */
export const formatBuildTimingBreakdown = ({
  queuedMs,
  processingMs,
}: Pick<BuildSchema, "queuedMs" | "processingMs">): string =>
  [
    queuedMs ? `${formatDuration(queuedMs)} queued` : null,
    processingMs ? `${formatDuration(processingMs)} processing` : null,
  ]
    .filter(Boolean)
    .join(", ");
