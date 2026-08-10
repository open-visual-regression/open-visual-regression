"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { orpc } from "@/lib/orpc/client";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";

const REFRESH_DEBOUNCE_MS = 400;

type BuildStatusStreamProps = {
  buildId: string;
  initialStatus: BuildStatus;
};

export const BuildStatusStream = ({ buildId, initialStatus }: BuildStatusStreamProps) => {
  const refreshReview = useReviewRefresh();

  const { data } = useQuery(
    orpc.builds.watchStatus.experimental_liveOptions({
      input: { buildId },
      context: { retry: Number.POSITIVE_INFINITY },
    }),
  );

  const streamedStatus = data?.status;

  useEffect(() => {
    if (!streamedStatus || streamedStatus === initialStatus) {
      return;
    }

    const timeout = setTimeout(refreshReview, REFRESH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [streamedStatus, initialStatus, refreshReview]);

  return (
    <span role="status" aria-label="build status" className="inline-flex">
      <BuildStatusBadge status={initialStatus} />
    </span>
  );
};
