"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

export type BuildApproveButtonProps = {
  buildId: string;
  approved: boolean;
};

export const BuildApproveButton = ({ buildId, approved }: BuildApproveButtonProps) => {
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
      color="green"
      disabled={pending || approved}
      className={
        approved
          ? "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent"
          : undefined
      }
      onClick={() => execute({ buildId, vote: "approve" })}
    >
      {approved ? "approved" : pending ? "approving..." : "approve all"}
    </Button>
  );
};
