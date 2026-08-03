import { DiffSchema } from "@ovr/api/contracts/diffs";
import { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Button } from "@ovr/ui/components/button";
import {
  ArrowLeftFromLineIcon,
  ArrowRightToLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerLeftUpIcon,
  Icon,
} from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography } from "@ovr/ui/components/typography";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { SnapshotApproveButton } from "./SnapshotApproveButton";
import { SnapshotRejectButton } from "./SnapshotRejectButton";

const ROW_CLASS_NAME =
  "bg-ovr-elevated border-b px-5 md:px-6 lg:px-10 py-2 flex flex-row justify-between shrink-0";

type ActionsRowProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
  projectId: string;
  buildId: string;
  prevSnapshotId: string | null;
  nextSnapshotId: string | null;
  position: number | null;
  total: number | null;
  canReview: boolean;
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
  canReview,
  sidebarCollapsed,
  onToggleSidebar,
}: ActionsRowProps) => {
  const snapshotHref = (id: string) => `/projects/${projectId}/builds/${buildId}/snapshots/${id}`;

  return (
    <div className={ROW_CLASS_NAME}>
      <div className="flex items-center flex-row gap-2">
        <ResponsiveActionButton href="../" icon={CornerLeftUpIcon}>
          back
        </ResponsiveActionButton>
        {prevSnapshotId || nextSnapshotId ? (
          <>
            <ResponsiveActionButton
              href={prevSnapshotId ? snapshotHref(prevSnapshotId) : null}
              disabled={!prevSnapshotId}
              icon={ChevronLeftIcon}
            >
              prev
            </ResponsiveActionButton>
            {position !== null && total !== null ? (
              <Typography variant="caption" className="tabular-nums">
                {position}/{total}
              </Typography>
            ) : null}
            <ResponsiveActionButton
              href={nextSnapshotId ? snapshotHref(nextSnapshotId) : null}
              disabled={!nextSnapshotId}
              icon={ChevronRightIcon}
              iconPosition="end"
            >
              next
            </ResponsiveActionButton>
          </>
        ) : null}
      </div>
      <div className="flex items-center flex-row gap-2">
        {canReview &&
        diff &&
        diff.reviewStatus !== "not_required" &&
        snapshot.status !== "error" ? (
          <>
            <SnapshotRejectButton diffId={diff.id} rejected={snapshot.status === "rejected"} />
            <SnapshotApproveButton diffId={diff.id} approved={snapshot.status === "approved"} />
          </>
        ) : null}
        <Button
          variant="outline"
          color="neutral"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon icon={sidebarCollapsed ? ArrowLeftFromLineIcon : ArrowRightToLineIcon} />
        </Button>
      </div>
    </div>
  );
};

export const SnapshotActionsRowSkeleton = () => (
  <div className={ROW_CLASS_NAME}>
    <div className="flex items-center flex-row gap-2">
      <Skeleton className="h-7 w-7 rounded-md lg:w-16" />
      <Skeleton className="h-7 w-7 rounded-md lg:w-16" />
      <Skeleton className="h-3 w-8" />
      <Skeleton className="h-7 w-7 rounded-md lg:w-16" />
    </div>
    <div className="flex items-center flex-row gap-2">
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="size-7 rounded-md" />
    </div>
  </div>
);
