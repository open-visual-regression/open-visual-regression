"use client";

import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { useSnapshotHistoryPrefetch } from "@/lib/orpc/useSnapshotHistoryPrefetch";
import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";
import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

import { SnapshotActionsRow } from "../snapshot-actions/SnapshotActionsRow";
import { ComparisonModeProvider } from "../snapshot-comparison-section/comparison-view/comparison-mode";
import { SnapshotSidebar } from "../snapshot-sidebar/SnapshotSidebar";
import { SnapshotShell } from "./SnapshotShell";

export type SnapshotLayoutProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
  projectId: string;
  buildId: string;
  prevSnapshotId: string | null;
  nextSnapshotId: string | null;
  position: number | null;
  total: number | null;
  filters?: SnapshotFilters;
  canReview: boolean;
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export const SnapshotLayout = ({
  snapshot,
  diff,
  projectId,
  buildId,
  prevSnapshotId,
  nextSnapshotId,
  position,
  total,
  filters,
  canReview,
  sidebar,
  children,
}: SnapshotLayoutProps) => {
  const { sidebarOpen, setSidebarOpen } = useSnapshotPreferences();
  const prefetchHistory = useSnapshotHistoryPrefetch(snapshot.id);

  const toggleSidebar = () => {
    if (!sidebarOpen) {
      prefetchHistory();
    }

    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SnapshotShell
      actions={
        <SnapshotActionsRow
          diff={diff}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
          prevSnapshotId={prevSnapshotId}
          nextSnapshotId={nextSnapshotId}
          position={position}
          total={total}
          filters={filters}
          canReview={canReview}
          sidebarCollapsed={!sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      }
      sidebar={<SnapshotSidebar collapsed={!sidebarOpen}>{sidebar}</SnapshotSidebar>}
    >
      <ComparisonModeProvider>{children}</ComparisonModeProvider>
    </SnapshotShell>
  );
};
