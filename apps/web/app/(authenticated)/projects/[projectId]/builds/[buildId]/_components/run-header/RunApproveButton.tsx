"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";
import { serverClient } from "@/lib/router";

export type RunApproveButtonProps = {
  buildId: string;
  approved: boolean;
  disabled?: boolean;
};

export const RunApproveButton = ({
  buildId,
  approved,
  disabled = false,
}: RunApproveButtonProps) => {
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
      disabled={pending || approved || disabled}
      onClick={() => execute({ buildId, vote: "approve" })}
    >
      {approved ? "approved" : pending ? "approving..." : "approve all"}
    </Button>
  );
};
