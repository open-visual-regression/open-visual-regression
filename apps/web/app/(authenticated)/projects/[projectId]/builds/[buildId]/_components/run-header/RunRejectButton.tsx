"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";
import { serverClient } from "@/lib/router";

export type RunRejectButtonProps = {
  buildId: string;
  rejected: boolean;
  disabled?: boolean;
};

export const RunRejectButton = ({ buildId, rejected, disabled = false }: RunRejectButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.diffs.bulkCastVote, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const pending = status === "pending";

  return (
    <Button
      variant="secondary"
      disabled={pending || rejected || disabled}
      onClick={() => execute({ buildId, vote: "reject" })}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject all"}
    </Button>
  );
};
