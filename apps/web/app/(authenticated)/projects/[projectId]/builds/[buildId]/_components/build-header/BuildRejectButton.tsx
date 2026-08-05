"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";
import { cn } from "@ovr/ui/lib/utils";

import { serverClient } from "@/lib/router";

export type BuildRejectButtonProps = {
  buildId: string;
  rejected: boolean;
};

export const BuildRejectButton = ({ buildId, rejected }: BuildRejectButtonProps) => {
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
      disabled={pending || rejected}
      className={cn(
        "flex-1 md:flex-none",
        rejected && "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent",
      )}
      onClick={() => execute({ buildId, vote: "reject" })}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject all"}
    </Button>
  );
};
