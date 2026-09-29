"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { Icon, LockOpenIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

type EnableStatusChecksButtonProps = {
  projectId: string;
  className?: string;
};

export const EnableStatusChecksButton = ({
  projectId,
  className,
}: EnableStatusChecksButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.gitIntegrations.setStatusChecks, {
    interceptors: [
      onSuccess(() => {
        toast.success("ci checks enabled");
        router.refresh();
      }),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={status === "pending"}
      onClick={() => execute({ projectId, enabled: true })}
      className={className}
    >
      <Icon icon={LockOpenIcon} className="md:max-xl:hidden" />
      {status === "pending" ? "enabling..." : "enable"}
    </Button>
  );
};
