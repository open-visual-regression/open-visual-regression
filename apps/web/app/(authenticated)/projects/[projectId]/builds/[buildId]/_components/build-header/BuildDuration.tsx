"use client";

import { useEffect, useState } from "react";

import { ClockIcon, Icon } from "@ovr/ui/components/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ovr/ui/components/tooltip";

import { formatDuration } from "@/lib/utils/date";

const TICK_MS = 1000;

export type BuildDurationProps = {
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export const BuildDuration = ({ createdAt, startedAt, finishedAt }: BuildDurationProps) => {
  const isRunning = finishedAt === null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [isRunning]);

  const created = new Date(createdAt).getTime();
  const started = startedAt === null ? null : new Date(startedAt).getTime();
  const ended = finishedAt === null ? now : new Date(finishedAt).getTime();

  const queuedMs = (started ?? ended) - created;
  const processingMs = started === null ? null : ended - started;
  const totalMs = ended - created;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="flex cursor-default items-center gap-1"
          aria-label={`total time ${formatDuration(totalMs)}`}
        >
          <Icon icon={ClockIcon} size={10} />
          <span suppressHydrationWarning>{formatDuration(totalMs)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
            <dt className="text-ovr-fg-secondary">queued</dt>
            <dd suppressHydrationWarning>{formatDuration(queuedMs)}</dd>
            {processingMs === null ? null : (
              <>
                <dt className="text-ovr-fg-secondary">build</dt>
                <dd suppressHydrationWarning>{formatDuration(processingMs)}</dd>
              </>
            )}
          </dl>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
