"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";
import { useRouter } from "next/navigation";

import { serverClient } from "@/lib/router";

export type BuildRejectButtonProps = {
  buildId: string;
  rejected: boolean;
  disabled?: boolean;
};

export const BuildRejectButton = ({
  buildId,
  rejected,
  disabled = false,
}: BuildRejectButtonProps) => {
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
      variant="outline"
      color="neutral"
      disabled={pending || rejected || disabled}
      className={
        rejected
          ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
          : undefined
      }
      onClick={() => execute({ buildId, vote: "reject" })}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject all"}
    </Button>
  );
};
