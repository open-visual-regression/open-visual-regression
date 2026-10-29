"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { Button } from "@ovr/ui/components/button";
import { CheckIcon, Icon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { StatusChecksToggleButton } from "./StatusChecksToggleButton";

type GitIntegrationActionsProps = {
  projectId: string;
  integration: GitIntegrationSchema | null;
  isSaving: boolean;
};

export const GitIntegrationActions = ({
  projectId,
  integration,
  isSaving,
}: GitIntegrationActionsProps) => {
  const router = useRouter();

  const test = useServerAction(serverClient.gitIntegrations.testConnection, {
    interceptors: [
      onSuccess((result) => {
        if (result.ok) {
          toast.success("connection ok");
        } else {
          toast.error(result.error ?? "connection failed");
        }
      }),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const disconnect = useServerAction(serverClient.gitIntegrations.remove, {
    interceptors: [
      onSuccess(() => {
        toast.success("git integration removed");
        router.refresh();
      }),
    ],
  });

  return (
    <>
      {integration ? (
        <div className="flex flex-col gap-2 @md:flex-row">
          <Button
            type="button"
            variant="outline"
            color="red"
            disabled={disconnect.status === "pending"}
            onClick={() => disconnect.execute({ projectId })}
            className="w-full @md:w-auto"
          >
            disconnect
          </Button>
          <StatusChecksToggleButton
            projectId={projectId}
            enabled={integration.statusChecksEnabled}
            className="w-full @md:w-auto"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 @md:ml-auto @md:flex-row">
        {integration ? (
          <Button
            type="button"
            variant="outline"
            disabled={test.status === "pending"}
            onClick={() => test.execute({ projectId })}
            className="w-full @md:w-auto"
          >
            {test.status === "pending" ? "testing..." : "test connection"}
          </Button>
        ) : null}
        <Button type="submit" disabled={isSaving} className="w-full @md:w-auto">
          <Icon icon={CheckIcon} />
          {isSaving ? "saving..." : "save"}
        </Button>
      </div>
    </>
  );
};
