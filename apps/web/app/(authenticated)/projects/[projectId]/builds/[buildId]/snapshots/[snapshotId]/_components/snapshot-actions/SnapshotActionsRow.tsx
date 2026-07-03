import { DiffSchema } from "@ovr/api/contracts/diffs";
import { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Button } from "@ovr/ui/components/button";
import { ChevronLeftIcon, ChevronRightIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

import { SnapshotApproveButton } from "./SnapshotApproveButton";
import { SnapshotRejectButton } from "./SnapshotRejectButton";

type ActionsRowProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
  projectId: string;
  buildId: string;
  prevSnapshotId: string | null;
  nextSnapshotId: string | null;
  position: number | null;
  total: number | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export const SnapshotActionsRow = ({
  diff,
  snapshot,
  projectId,
  buildId,
  prevSnapshotId,
  nextSnapshotId,
  position,
  total,
  sidebarCollapsed,
  onToggleSidebar,
}: ActionsRowProps) => {
  const snapshotHref = (id: string) => `/projects/${projectId}/builds/${buildId}/snapshots/${id}`;

  return (
    <div className="bg-ovr-elevated border-b px-5 md:px-6 lg:px-10 py-2 flex flex-row justify-between shrink-0">
      <div className="flex items-center flex-row gap-2">
        <ButtonLink href="../" variant="outline" color="neutral" size="sm">
          <Icon icon={ChevronLeftIcon} />
          back
        </ButtonLink>
        {diff && diff.reviewStatus !== "not_required" && snapshot.status !== "error" ? (
          <>
            <SnapshotRejectButton diffId={diff.id} rejected={snapshot.status === "rejected"} />
            <SnapshotApproveButton diffId={diff.id} approved={snapshot.status === "approved"} />
          </>
        ) : null}
      </div>
      <div className="flex items-center flex-row gap-2">
        {prevSnapshotId || nextSnapshotId ? (
          <>
            <ButtonLink
              href={prevSnapshotId ? snapshotHref(prevSnapshotId) : null}
              disabled={!prevSnapshotId}
              variant="outline"
              color="neutral"
              size="sm"
            >
              <Icon icon={ChevronLeftIcon} />
              prev
            </ButtonLink>
            {position !== null && total !== null ? (
              <Typography variant="caption" className="tabular-nums">
                {position}/{total}
              </Typography>
            ) : null}
            <ButtonLink
              href={nextSnapshotId ? snapshotHref(nextSnapshotId) : null}
              disabled={!nextSnapshotId}
              variant="outline"
              color="neutral"
              size="sm"
            >
              next
              <Icon icon={ChevronRightIcon} />
            </ButtonLink>
          </>
        ) : null}
        <Button
          variant="outline"
          color="neutral"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon icon={sidebarCollapsed ? ChevronLeftIcon : ChevronRightIcon} />
        </Button>
      </div>
    </div>
  );
};
