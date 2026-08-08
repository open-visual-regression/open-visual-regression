"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { serverClient } from "@/lib/router";

export type SnapshotRejectButtonProps = {
  diffId: string;
  rejected: boolean;
  nextHref: string | null;
};

export const SnapshotRejectButton = ({ diffId, rejected, nextHref }: SnapshotRejectButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.diffs.castVote, {
    interceptors: [
      onSuccess(() => {
        // A next snapshot already navigated away optimistically, so the
        // current route no longer needs a refresh.
        if (!nextHref) router.refresh();
      }),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const pending = status === "pending";

  const handleClick = () => {
    execute({ diffId, vote: "reject" });
    // Assume the vote succeeds and move on right away; onError above
    // surfaces a toast if it didn't.
    if (nextHref) router.push(nextHref);
  };

  return (
    <ResponsiveActionButton
      icon={XIcon}
      disabled={pending || rejected}
      className={
        rejected
          ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
          : undefined
      }
      onClick={handleClick}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject"}
    </ResponsiveActionButton>
  );
};
