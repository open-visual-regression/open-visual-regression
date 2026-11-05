"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@ovr/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import {
  ArrowRightIcon,
  CircleSlash2Icon,
  EllipsisIcon,
  ExternalLinkIcon,
  Icon,
  RefreshCwIcon,
} from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

import { BuildCancelDialog } from "./BuildCancelButton";
import { BuildRebuildDialog } from "./BuildRebuildButton";

export type BuildActionsMenuProps = {
  buildId: string;
  projectId: string;
  storybookHref: string | null;
  latestBuildHref: string | null;
  canCancel: boolean;
  canRebuild: boolean;
  className?: string;
};

// The header's secondary actions in one menu, for screens too narrow to show them as buttons.
export const BuildActionsMenu = ({
  buildId,
  projectId,
  storybookHref,
  latestBuildHref,
  canCancel,
  canRebuild,
  className,
}: BuildActionsMenuProps) => {
  const [dialog, setDialog] = useState<"cancel" | "rebuild" | null>(null);

  const closeDialog = (open: boolean) => {
    if (!open) {
      setDialog(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              color="neutral"
              className={cn("w-8 shrink-0 px-0", className)}
            />
          }
          aria-label="more build actions"
        >
          <Icon icon={EllipsisIcon} size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto whitespace-nowrap">
          {storybookHref ? (
            <DropdownMenuItem
              render={<a href={storybookHref} target="_blank" rel="noopener noreferrer" />}
            >
              <Icon icon={ExternalLinkIcon} />
              view storybook
            </DropdownMenuItem>
          ) : null}
          {latestBuildHref ? (
            <DropdownMenuItem render={<Link href={latestBuildHref} />}>
              <Icon icon={ArrowRightIcon} />
              view latest build
            </DropdownMenuItem>
          ) : null}
          {canRebuild ? (
            <DropdownMenuItem onClick={() => setDialog("rebuild")}>
              <Icon icon={RefreshCwIcon} />
              rebuild
            </DropdownMenuItem>
          ) : null}
          {canCancel ? (
            <DropdownMenuItem color="red" onClick={() => setDialog("cancel")}>
              <Icon icon={CircleSlash2Icon} />
              cancel build
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <BuildCancelDialog buildId={buildId} open={dialog === "cancel"} onOpenChange={closeDialog} />
      <BuildRebuildDialog
        buildId={buildId}
        projectId={projectId}
        open={dialog === "rebuild"}
        onOpenChange={closeDialog}
      />
    </>
  );
};
