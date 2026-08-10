"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { isTerminalBuildStatus, type BuildStatus } from "@ovr/api/contracts/builds";

import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { orpc } from "@/lib/orpc/client";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";

const POLL_INTERVAL_MS = 5000;
const REFRESH_DEBOUNCE_MS = 400;

type BuildStatusWatcherProps = {
  buildId: string;
  initialStatus: BuildStatus;
};

export const BuildStatusWatcher = ({ buildId, initialStatus }: BuildStatusWatcherProps) => {
  const refreshReview = useReviewRefresh();

  const { data } = useQuery(
    orpc.builds.getStatus.queryOptions({
      input: { buildId },
      refetchInterval: isTerminalBuildStatus(initialStatus) ? false : POLL_INTERVAL_MS,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }),
  );

  const polledStatus = data?.status;

  useEffect(() => {
    if (!polledStatus || polledStatus === initialStatus) {
      return;
    }

    const timeout = setTimeout(refreshReview, REFRESH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [polledStatus, initialStatus, refreshReview]);

  return (
    <span role="status" aria-label="build status" className="inline-flex">
      <BuildStatusBadge status={initialStatus} />
    </span>
  );
};
