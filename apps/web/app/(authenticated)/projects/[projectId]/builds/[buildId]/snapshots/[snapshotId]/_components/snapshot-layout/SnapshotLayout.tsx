"use client";

import { useState } from "react";

import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { SnapshotActionsRow } from "../snapshot-actions/SnapshotActionsRow";
import { SnapshotSidebar } from "../snapshot-sidebar/SnapshotSidebar";

export type SnapshotLayoutProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
  projectId: string;
  buildId: string;
  prevSnapshotId: string | null;
  nextSnapshotId: string | null;
  position: number | null;
  total: number | null;
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
  canReview,
  sidebar,
  children,
}: SnapshotLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="absolute inset-0 flex flex-col">
      <SnapshotActionsRow
        diff={diff}
        snapshot={snapshot}
        projectId={projectId}
        buildId={buildId}
        prevSnapshotId={prevSnapshotId}
        nextSnapshotId={nextSnapshotId}
        position={position}
        total={total}
        canReview={canReview}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div className="flex min-h-0 flex-1 flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
          {children}
        </div>
        {sidebarCollapsed ? null : <SnapshotSidebar>{sidebar}</SnapshotSidebar>}
      </div>
    </div>
  );
};
