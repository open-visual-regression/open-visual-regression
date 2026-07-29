"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import { cn } from "@ovr/ui/lib/utils";

import { serverClient } from "@/lib/router";

export type SnapshotRejectButtonProps = {
  diffId: string;
  rejected: boolean;
};

export const SnapshotRejectButton = ({ diffId, rejected }: SnapshotRejectButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.diffs.castVote, {
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
        "w-7 gap-0 px-0 lg:w-auto lg:gap-1 lg:px-2.5",
        rejected && "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent",
      )}
      onClick={() => execute({ diffId, vote: "reject" })}
      size="sm"
    >
      <Icon icon={XIcon} />
      <span className="sr-only lg:not-sr-only">
        {rejected ? "rejected" : pending ? "rejecting..." : "reject"}
      </span>
    </Button>
  );
};
