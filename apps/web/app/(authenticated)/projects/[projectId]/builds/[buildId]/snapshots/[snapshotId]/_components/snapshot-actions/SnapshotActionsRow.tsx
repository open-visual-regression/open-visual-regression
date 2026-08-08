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
import { cn } from "@ovr/ui/lib/utils";

import {
  ResponsiveActionButton,
  ResponsiveActionButtonSkeleton,
} from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { SnapshotApproveButton } from "./SnapshotApproveButton";
import { SnapshotRejectButton } from "./SnapshotRejectButton";

type SnapshotActionsRowLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

const SnapshotActionsRowLayout = ({ className, children }: SnapshotActionsRowLayoutProps) => (
  <div
    className={cn(
      "flex shrink-0 flex-row justify-between border-b bg-ovr-elevated px-5 py-2 md:px-6 lg:px-10",
      className,
    )}
  >
    {children}
  </div>
);

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
  const nextHref = nextSnapshotId ? snapshotHref(nextSnapshotId) : null;

  return (
    <SnapshotActionsRowLayout>
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
            <SnapshotRejectButton
              diffId={diff.id}
              rejected={snapshot.status === "rejected"}
              nextHref={nextHref}
            />
            <SnapshotApproveButton
              diffId={diff.id}
              approved={snapshot.status === "approved"}
              nextHref={nextHref}
            />
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
    </SnapshotActionsRowLayout>
  );
};

export const SnapshotActionsRowSkeleton = () => (
  <SnapshotActionsRowLayout>
    <div className="flex flex-row items-center gap-2">
      <ResponsiveActionButtonSkeleton className="lg:w-16" />
      <ResponsiveActionButtonSkeleton className="lg:w-16" />
      <Skeleton className="h-4 w-6" />
      <ResponsiveActionButtonSkeleton className="lg:w-16" />
    </div>
    <div className="flex flex-row items-center gap-2">
      <ResponsiveActionButtonSkeleton className="lg:w-20" />
      <ResponsiveActionButtonSkeleton className="lg:w-24" />
      <Skeleton className="size-7 shrink-0 rounded-md" />
    </div>
  </SnapshotActionsRowLayout>
);
