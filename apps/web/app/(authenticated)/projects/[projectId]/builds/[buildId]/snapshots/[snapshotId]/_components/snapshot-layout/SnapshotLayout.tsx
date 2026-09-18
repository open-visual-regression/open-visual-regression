"use client";

import { useState } from "react";

import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

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
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
      }
      sidebar={<SnapshotSidebar collapsed={sidebarCollapsed}>{sidebar}</SnapshotSidebar>}
    >
      <ComparisonModeProvider>{children}</ComparisonModeProvider>
    </SnapshotShell>
  );
};
