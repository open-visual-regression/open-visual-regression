"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { ResponsiveActionButton } from "./ResponsiveActionButton";

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
    <ResponsiveActionButton
      icon={XIcon}
      disabled={pending || rejected}
      className={
        rejected
          ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
          : undefined
      }
      onClick={() => execute({ diffId, vote: "reject" })}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject"}
    </ResponsiveActionButton>
  );
};
