"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { orpc } from "@/lib/orpc/client";

const REFRESH_DEBOUNCE_MS = 400;

type BuildStatusStreamProps = {
  buildId: string;
  initialStatus: BuildStatus;
};

export const BuildStatusStream = ({ buildId, initialStatus }: BuildStatusStreamProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery(
    orpc.builds.watchStatus.experimental_liveOptions({
      input: { buildId },
      placeholderData: { status: initialStatus },
      context: { retry: Number.POSITIVE_INFINITY },
    }),
  );
  const status = data?.status ?? initialStatus;

  const refreshedStatus = useRef(status);
  useEffect(() => {
    if (status === refreshedStatus.current) {
      return;
    }
    refreshedStatus.current = status;
    const timeout = setTimeout(() => {
      router.refresh();
      void queryClient.invalidateQueries({ queryKey: orpc.snapshots.list.key() });
    }, REFRESH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [status, router, queryClient]);

  return (
    <span role="status" aria-label="build status" className="inline-flex">
      <BuildStatusBadge status={status} />
    </span>
  );
};
