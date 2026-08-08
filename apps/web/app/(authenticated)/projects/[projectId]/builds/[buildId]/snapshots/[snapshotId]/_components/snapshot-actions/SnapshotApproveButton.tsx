"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { CheckIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { serverClient } from "@/lib/router";

export type SnapshotApproveButtonProps = {
  diffId: string;
  approved: boolean;
  nextHref: string | null;
};

export const SnapshotApproveButton = ({
  diffId,
  approved,
  nextHref,
}: SnapshotApproveButtonProps) => {
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
    execute({ diffId, vote: "approve" });
    // Assume the vote succeeds and move on right away; onError above
    // surfaces a toast if it didn't.
    if (nextHref) router.push(nextHref);
  };

  return (
    <ResponsiveActionButton
      icon={CheckIcon}
      color="green"
      disabled={pending || approved}
      className={
        approved
          ? "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent"
          : undefined
      }
      onClick={handleClick}
    >
      {approved ? "approved" : pending ? "approving..." : "approve"}
    </ResponsiveActionButton>
  );
};
