"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { client } from "@/lib/orpc/client";

// The badge reflects each streamed status immediately; the rest of the page (counts,
// snapshots, action buttons) is refreshed from the server, debounced so a burst of
// transitions collapses into a single refetch.
const REFRESH_DEBOUNCE_MS = 400;

type BuildStatusStreamProps = {
  buildId: string;
  initialStatus: BuildStatus;
};

export const BuildStatusStream = ({ buildId, initialStatus }: BuildStatusStreamProps) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
    };

    const consume = async () => {
      try {
        const events = await client.builds.watchStatus(
          { buildId },
          { signal: controller.signal, context: { retry: Number.POSITIVE_INFINITY } },
        );
        for await (const event of events) {
          setStatus(event.status);
          scheduleRefresh();
        }
      } catch {
        // Aborted on unmount, or the stream ended after exhausting reconnect attempts.
      }
    };

    void consume();

    return () => {
      controller.abort();
      clearTimeout(refreshTimer);
    };
  }, [buildId, router]);

  return <BuildStatusBadge status={status} />;
};
