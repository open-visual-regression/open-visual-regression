"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Icon, PlusIcon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import { Typography } from "@ovr/ui/components/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ovr/ui/components/table";
import { serverClient } from "@/lib/router";
import type { CaptureConfigurationDto } from "@ovr/api/contracts/projects";
import { AddCaptureConfigurationModal } from "../add-capture-configuration/AddCaptureConfigurationModal";
import { AddCaptureConfigurationModalButton } from "../add-capture-configuration/AddCaptureConfigurationModalButton";
import { NoCaptureConfigurationsSection } from "./NoCaptureConfigurationsSection";

type CaptureConfigurationsSectionProps = {
  projectId: string;
  captureConfigurations: CaptureConfigurationDto[];
};

export const CaptureConfigurationsSection = ({
  projectId,
  captureConfigurations,
}: CaptureConfigurationsSectionProps) => {
  const router = useRouter();

  const { execute: executeRemove } = useServerAction(
    serverClient.projects.removeCaptureConfiguration,
    {
      interceptors: [
        onSuccess(() => router.refresh()),
        onError((err) => toast.error(err.message)),
      ],
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography variant="h2">capture configurations</Typography>
        <AddCaptureConfigurationModal
          projectId={projectId}
          trigger={
            <AddCaptureConfigurationModalButton>
              <Icon icon={PlusIcon} />
              add configuration
            </AddCaptureConfigurationModalButton>
          }
        />
      </div>
      {captureConfigurations.length === 0 ? (
        <NoCaptureConfigurationsSection projectId={projectId} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>name</TableHead>
              <TableHead>browser</TableHead>
              <TableHead>viewport</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {captureConfigurations.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{config.name}</TableCell>
                <TableCell>{config.browser}</TableCell>
                <TableCell>
                  {config.viewportWidth}×{config.viewportHeight}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`remove ${config.name}`}
                    onClick={() => executeRemove({ captureConfigurationId: config.id })}
                  >
                    <Icon icon={XIcon} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
