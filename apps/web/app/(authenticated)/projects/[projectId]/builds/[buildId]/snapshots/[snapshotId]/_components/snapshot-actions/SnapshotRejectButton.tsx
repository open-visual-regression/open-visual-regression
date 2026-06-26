"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
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
      className={
        rejected
          ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
          : undefined
      }
      onClick={() => execute({ diffId, vote: "reject" })}
      size="sm"
    >
      <Icon icon={XIcon} />
      {rejected ? "rejected" : pending ? "rejecting..." : "reject"}
    </Button>
  );
};
